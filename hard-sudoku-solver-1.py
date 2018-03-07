import copy

def sudoku_solver(puzzle):
    global running

    init(puzzle)
    running = True
    while running:
        p, fixed = getNext()
        if p:
            doSuccess(p, fixed)
        else:
            doFail()

    return solved

def init(puzzle):
    global grid, stack, value, index, start, running, solved

    grid = puzzle
    stack = []
    value = 1
    index = 0
    start = 0
    running = False
    solved = None

class Position(object):
    def __init__(self, row, col):
        super(Position, self).__init__()
        self.row = row
        self.col = col

def getNext():
    row, col = index2Position(index)
    for i in xrange(start, 9):
        p = Position(
            row + int(i / 3),
            col + i % 3
        )
        v = grid[p.row][p.col]
        if v == value:
            return p, True
        if v or not checkRow(p.row) or not checkCol(p.col) or not checkSubGrid():
            continue

        return p, False

    return None, False

def doSuccess(pos, fixed):
    global value, index, start, solved

    if value == 9 and index == 8:
        if solved:
            raise Exception('multiply solutions')
        else:
            solved = copy.deepcopy(grid)
            solved[pos.row][pos.col] = value
            doFail()
            return

    grid[pos.row][pos.col] = value
    stack.append([value, index, fixed, pos])

    index += 1
    start = 0
    if index == 9:
        index = 0

        value += 1

def doFail():
    global running

    if not len(stack):
        if solved:
            running = False
            return
        else:
            raise Exception('unable to solve')

    v, i, fixed, pos = stack.pop()

    global value, index, start
    value = v
    index = i
    start = indexOfSubGrid(pos, i) + 1
    if not fixed:
        grid[pos.row][pos.col] = 0

def checkRow(row):
    for i in xrange(0, 9):
        if grid[row][i] == value:
            return False
    return True

def checkCol(col):
    for i in xrange(0, 9):
        if grid[i][col] == value:
            return False
    return True

def checkSubGrid():
    row, col = index2Position(index)
    for i in xrange(0, 9):
        r = row + int(i / 3)
        c = col + i % 3
        if grid[r][c] == value:
            return False
    return True

def index2Position(i):
    return int(i / 3) * 3, index % 3 * 3

def indexOfSubGrid(pos, i):
    row, col = index2Position(i)
    return (pos.row - row) * 3 + pos.col - col
