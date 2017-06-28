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
        return this.pieces.filter((p) => this.isThreating(this.king, p));
    }
    isMate() {
        const pieces = this.isCheck();
        return pieces.length && this.pieces.every((p) => !this.isSolutionExisted(p));
    }

    isThreating(king, piece) {
        if (piece.owner == this.player) return false;

        switch (piece.piece) {
        case 'pawn':
            return this.checkCell(king, piece, 1, this.player ? -1 : 1)
                    || this.checkCell(king, piece, -1, this.player ? -1 : 1);
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
    isSolutionExisted(piece) {
        if (piece.owner != this.player) return false;

        // TODO:
    }

    isValid(x, y) {
        return x >= 0 && x < Grid.size && y >= 0 && y < Grid.size;
    }
    isNotBlocked(king, piece) {
        const deltaX = piece.x > king.x ? 1 : (piece.x < king.x ? -1 : 0);
        const deltaY = piece.y > king.y ? 1 : (piece.y < king.y ? -1 : 0);
        let x = piece.x + deltaX;
        let y = piece.y + deltaY;

        while (x != king.x && y != king.y && this.isValid(x, y)) {
            if (this.grid[x][y]) return false;

            x += deltaX;
            y += deltaY;
        }
        return true;
    }
    checkCell(king, piece, deltaX, deltaY) {
        const x = piece.x + deltaX;
        const y = piece.y + deltaY;
        return this.isValid(x, y) && king == this.grid[x][y];
    }
    checkRowAndColumn(king, piece) {
        return (piece.x == king.x || piece.y == king.y) && this.isNotBlocked(king, piece);
    }
    checkDiagonal(king, piece) {
        return (piece.x + piece.y == king.x + king.y || piece.x - piece.y == king.x - king.y)
                && this.isNotBlocked(king, piece);
    }
}
Grid.size = 8;

// Returns an array of threats if the arrangement of
// the pieces is a check, otherwise false
function isCheck(pieces, player) {
    const grid = new Grid(pieces, player);
    return grid.isCheck();
}

// Returns true if the arrangement of the
// pieces is a check mate, otherwise false
function isMate(pieces, player) {
    const grid = new Grid(pieces, player);
    return grid.isMate();
}
