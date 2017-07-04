class Grid {
    constructor(pieces, player) {
        this.pieces = pieces;
        this.player = player; // who to play

        this.grid = new Array(Grid.size).fill(0).map(() => []);
        pieces.forEach((p) => {
            this.grid[p.x][p.y] = p;

            if (p.owner == player && p.piece == 'king') this.king = p;
        });
    }
    isCheck() {
        return this.pieces.filter((p) => this.isThreating(this.king, p, this.player));
    }
    isMate() {
        const pieces = this.isCheck();

        if (!pieces.length) return false;
        if (pieces.length == 1) {
            // kill or block
            const candidates = this.whoCanSave(this.king, pieces[0]);
            const canSolved = candidates.some((item) => {
                return item.pieces.some((p) => {
                    const gridBackup = this.cloneGrid();
                    if (item.killed) {
                        this.grid[item.killed.x][item.killed.y] = null;
                    }
                    this.grid[p.x][p.y] = null;
                    this.grid[item.x][item.y] = {
                        piece: p.piece,
                        owner: p.owner,
                        x: item.x,
                        y: item.y
                    };

                    const ps = this.isCheck().filter((other) => this.grid[other.x][other.y] == other);
                    const stillChecking = ps.length;
                    this.grid = gridBackup;
                    return !stillChecking;
                });
            });
            if (canSolved) return false;
        }

        // move the king
        for (let x = this.king.x - 1; x - this.king.x <= 1; x++) {
            for (let y = this.king.y - 1; y - this.king.y <= 1; y++) {
                if (!this.isValid(x, y)) continue;

                const other = this.grid[x][y];
                if (other && other.owner == this.player) continue;

                const gridBackup = this.cloneGrid();
                const kingBackup = this.king;
                this.grid[this.king.x][this.king.y] = null;
                this.grid[x][y] = this.king = {
                    piece: 'king',
                    player: this.player,
                    x: x,
                    y: y
                };

                const ps = this.isCheck().filter((other) => this.grid[other.x][other.y] == other);
                const stillChecking = ps.length;
                if (!stillChecking) return false;
                this.grid = gridBackup;
                this.king = kingBackup;
            }
        }
        return true;
    }

    isThreating(king, piece, player) {
        if (piece.owner == player) return false;

        switch (piece.piece) {
        case 'pawn':
            const deltaY = player ? -1 : 1;
            if (!this.grid[king.x][king.y]) {
                // the target is an empty slot
                return this.checkCell(king, piece, 0, deltaY)
                        || (!this.grid[piece.x][piece.y + deltaY] && this.checkCell(king, piece, 0, deltaY * 2));
            }
            return this.checkCell(king, piece, 1, deltaY)
                    || this.checkCell(king, piece, -1, deltaY);
        case 'knight':
            return this.checkCell(king, piece, 1, 2) || this.checkCell(king, piece, 1, -2)
                    || this.checkCell(king, piece, -1, 2) || this.checkCell(king, piece, -1, -2)
                    || this.checkCell(king, piece, 2, 1) || this.checkCell(king, piece, 2, -1)
                    || this.checkCell(king, piece, -2, 1) || this.checkCell(king, piece, -2, -1);
        case 'rook':
            return this.checkRowAndColumn(king, piece);
        case 'bishop':
            return this.checkDiagonal(king, piece);
        case 'queen':
            return this.checkRowAndColumn(king, piece) || this.checkDiagonal(king, piece);
        case 'king':
            return Math.abs(piece.x - king.x) <= 1 && Math.abs(piece.y - king.y) <= 1;
        default:
            throw new Error('unknow piece: ' + piece.piece);
        }
    }

    isValid(x, y) {
        return x >= 0 && x < Grid.size && y >= 0 && y < Grid.size;
    }
    isNotBlocked(king, piece) {
        const deltaX = piece.x > king.x ? -1 : (piece.x < king.x ? 1 : 0);
        const deltaY = piece.y > king.y ? -1 : (piece.y < king.y ? 1 : 0);
        let x = piece.x + deltaX;
        let y = piece.y + deltaY;

        while (!(x == king.x && y == king.y) && this.isValid(x, y)) {
            if (this.grid[x][y]) return false;

            x += deltaX;
            y += deltaY;
        }
        return true;
    }
    checkCell(king, piece, deltaX, deltaY) {
        const x = piece.x + deltaX;
        const y = piece.y + deltaY;
        return this.isValid(x, y) && x == king.x && y == king.y;
    }
    checkRowAndColumn(king, piece) {
        return (piece.x == king.x || piece.y == king.y) && this.isNotBlocked(king, piece);
    }
    checkDiagonal(king, piece) {
        return (piece.x + piece.y == king.x + king.y || piece.x - piece.y == king.x - king.y)
                && this.isNotBlocked(king, piece);
    }

    whoCanSave(king, piece) {
        const deltaX = piece.x > king.x ? -1 : (piece.x < king.x ? 1 : 0);
        const deltaY = piece.y > king.y ? -1 : (piece.y < king.y ? 1 : 0);
        let x = piece.x;
        let y = piece.y;

        let candidates = [];
        while (!(x == king.x && y == king.y) && this.isValid(x, y)) {
            const target = {
                owner: this.player ? 0 : 1,
                x: x,
                y: y
            };
            const ps = this.pieces.filter((p) => p.owner == this.player
                    && p.piece != 'king' && this.isThreating(target, p, this.player ? 0 : 1));
            if (ps.length) {
                candidates.push({
                    pieces: ps,
                    killed: x == piece.x && y == piece.y ? piece : null,
                    x: x,
                    y: y
                });
            }

            x += deltaX;
            y += deltaY;
        }
        // en passant
        if (piece.piece == 'pawn' && Math.abs(piece.y - piece.prevY) == 2) {
            let other;
            if (this.isValid(piece.x - 1, piece.y)) {
                other = this.grid[piece.x - 1][piece.y];
            } else if (this.isValid(piece.x + 1, piece.y)) {
                other = this.grid[piece.x + 1][piece.y];
            }

            if (other && other.owner == this.player && other.piece == 'pawn') {
                candidates.push({
                    pieces: [other],
                    killed: piece,
                    x: piece.x,
                    y: piece.y + (this.player ? 1 : -1)
                });
            }
        }
        return candidates; // includes some duplicated, but it doesn't matter
    }
    cloneGrid() {
        return this.grid.map((row) => row.concat([]));
    }
}
Grid.size = 8;

// Returns an array of threats if the arrangement of
// the pieces is a check, otherwise false
function isCheck(pieces, player) {
    const grid = new Grid(pieces, player);
    const ps = grid.isCheck();
    return ps.length ? ps : false;
}

// Returns true if the arrangement of the
// pieces is a check mate, otherwise false
function isMate(pieces, player) {
    const grid = new Grid(pieces, player);
    return grid.isMate();
}
