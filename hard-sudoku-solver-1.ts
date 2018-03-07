namespace Sudoku {
    export type Grid = number[][];

    export interface Position {
        row: number;
        col: number;
    }
    export interface Step {
        value: number;
        index: number;
        pos: Position;
    }
}

import Grid = Sudoku.Grid;
import Position = Sudoku.Position;
import Step = Sudoku.Step;

export default class Solver {
    grid: Grid;

    stack: Step[];
    value: number;
    index: number;
    start: number;
    running: boolean;

    constructor(grid: Grid) {
        this.grid = grid;
    }
    reset(): void {
        this.stack = [];
        this.value = 1;
        this.index = 0;
        this.start = 0;
        this.running = false;
    }
    run(): void {
        this.reset();

        this.running = true;
        while (this.running) {
            const pos = this.next();
            if (pos) {
                this.success(pos);
            } else {
                this.fail();
            }
        }
    }
    next(): Position {
        // try to place <value> into subgrid <index> from <start>
        const {row, col} = index2Position(this.index);
        for (let i = this.start; i < 9; i++) {
            const p = {
                row: row + Math.floor(i / 3),
                col: col + i % 3
            };
            if (this.grid[p.row][p.col]) continue;
            if (!this.checkRow(p.row)) continue;
            if (!this.checkCol(p.col)) continue;
            if (!this.checkSubGrid(p)) continue;

            return p;
        }
        return null;
    }
    success(pos: Position): void {
        this.grid[pos.row][pos.col] = this.value;
        this.stack.push({
            value: this.value,
            index: this.index,
            pos
        });

        this.index++;
        this.start = 0;
        if (this.index == 9) {
            this.index = 0;

            this.value++;
            if (this.value > 9) {
                // FIXME: done, ignore unsolvable
                this.running = false;
            }
        }
    }
    fail(): void {
        if (!this.stack.length) throw new Error('unsolvable');

        let {value, index, pos} = this.stack.pop();
        this.value = value;
        this.index = index;
        this.start = indexOfSubGrid(pos, index);
        this.grid[pos.row][pos.col] = 0;
    }

    checkRow(row: number): boolean {
        for (let i = 0; i < 9; i++) {
            if (this.grid[row][i] == this.value) return false;
        }
        return true;
    }
    checkCol(col: number): boolean {
        for (let i = 0; i < 9; i++) {
            if (this.grid[i][col] == this.value) return false;
        }
        return true;
    }
    checkSubGrid(p: Position): boolean {
        const {row, col} = index2Position(this.index);
        for (let i = this.start; i < 9; i++) {
            const p = {
                row: row + Math.floor(i / 3),
                col: col + i % 3
            };
            if (this.grid[p.row][p.col] == this.value) return false;
        }
        return true;
    }
}

function index2Position(index: number): Position {
    return {
        row: Math.floor(index / 3) * 3,
        col: index % 3 * 3
    };
}
function indexOfSubGrid(pos: Position, index: number): number {
    const p = index2Position(index);
    return (pos.row - p.row) * 3 + pos.col - p.col;
}
