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
        return this.pieces.filter(this.isThreating.bind(this));
    }
    isMate() {
        const pieces = this.isCheck();
        return pieces.length && this.pieces.every((p) => !this.isSolutionExisted(p));
    }

    isThreating(piece) {
        if (piece.owner == this.player) return false;

        switch (piece.piece) {
        case 'pawn':
            return this.checkCell(piece, 1, this.player ? -1 : 1)
                    || this.checkCell(piece, -1, this.player ? -1 : 1);
        case 'knight':
            return this.checkCell(piece, 1, 2) || this.checkCell(piece, 1, -2)
                    || this.checkCell(piece, -1, 2) || this.checkCell(piece, -1, -2)
                    || this.checkCell(piece, 2, 1) || this.checkCell(piece, 2, -1)
                    || this.checkCell(piece, -2, 1) || this.checkCell(piece, -2, -1);
        case 'rook':
            return this.checkSameLine(piece, 1, 0) || this.checkSameLine(piece, 0, 1)
                    || this.checkSameLine(piece, -1, 0) || this.checkSameLine(piece, 0, -1);
        case 'bishop':
            return this.checkSameLine(piece, 1, 1) || this.checkSameLine(piece, 1, -1)
                    || this.checkSameLine(piece, -1, 1) || this.checkSameLine(piece, -1, -1);
        case 'queen':
            return this.checkSameLine(piece, 1, 0) || this.checkSameLine(piece, 0, 1)
                    || this.checkSameLine(piece, -1, 0) || this.checkSameLine(piece, 0, -1)
                    || this.checkSameLine(piece, 1, 1) || this.checkSameLine(piece, 1, -1)
                    || this.checkSameLine(piece, -1, 1) || this.checkSameLine(piece, -1, -1);
        case 'king':
            return Math.abs(piece.x - this.king.x) <= 1 && Math.abs(piece.y - this.king.y) <= 1;
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
    checkCell(piece, deltaX, deltaY) {
        const x = piece.x + deltaX;
        const y = piece.y + deltaY;
        return this.isValid(x, y) && this.king == this.grid[x][y];
    }
    checkSameLine(piece, deltaX, deltaY) {
        let x = piece.x + deltaX, y = piece.y + deltaY;
        while (this.isValid(x, y)) {
            const other = this.grid[x][y];
            if (other) return other == this.king;

            x += deltaX;
            y += deltaY;
        }
        return false;
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
