import copy

def sudoku_solver(puzzle):
    global running

    init(puzzle)
    running = True
    while running:
        p = queue[index]
        res = getNext(p)
        if res:
            doSuccess(p)
        else:
            doFail()

    return solved

def init(puzzle):
    global grid, stack, value, index, start, running, solved

    grid = puzzle
    initCache()

    stack = [] # saved steps for reverting
    value = 1
    index = 0  # place which cell now
    start = 0  # start with which value
    running = False
    solved = None

def initCache():
    # FIXME: pollute global to reuse functions
    global queue, value, cache

    if len(grid) != 9:
        raise Exception('invalid puzzle')

    cache = map(lambda i: [0] * 9, xrange(9))
    queue = []
    for row in xrange(9):
        if len(grid[row]) != 9:
            raise Exception('invalid puzzle')

        for col in xrange(9):
            temp = grid[row][col]
            if not (isinstance(temp, int) and temp >= 0 and temp <= 9):
                raise Exception('invalid puzzle')
            grid[row][col] = 0

            p = Position(row, col)
            for x in xrange(1, 10):
                value = x
                if checkRow(row) and checkCol(col) and checkSubGrid(p):
                    cache[row][col] |= 1 << x

            if temp and not cache[row][col] & (1 << temp):
                raise Exception('invalid puzzle')
            grid[row][col] = temp # recover

            if not temp:
                queue.append(p)

    # the place order
    queue = sorted(queue, lambda p1, p2: getPriority(p1) - getPriority(p2))

def getPriority(p):
    igrid = int(p.row / 3) * 3 + int(p.col / 3)
    icell = indexOfSubGrid(p, igrid)
    return igrid * 9 + icell

class Position(object):
    def __init__(self, row, col):
        super(Position, self).__init__()
        self.row = row
        self.col = col

def getNext(p):
    global value

    for i in xrange(start, 10):
        v = grid[p.row][p.col]
        if v:
            raise Exception('wrong order')

        value = i
        valid = cache[p.row][p.col] & (1 << value)
        if not (valid and checkRow(p.row) and checkCol(p.col) and checkSubGrid(p)):
            continue

        return True

    return False

def doSuccess(pos):
    global value, index, start, solved

    if index == len(queue) - 1:
        if solved:
            raise Exception('multiply solutions')
        else:
            solved = copy.deepcopy(grid)
            solved[pos.row][pos.col] = value
            doFail()
            return

    grid[pos.row][pos.col] = value
    stack.append([pos, value])

    index += 1
    start = 0

def doFail():
    global running, index, start

    if index == 0:
        if solved:
            running = False
            return
        else:
            raise Exception('unable to solve')

    pos, v = stack.pop()

    index -= 1
    start = v + 1
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

def checkSubGrid(p):
    row = p.row - (p.row % 3)
    col = p.col - (p.col % 3)
    for i in xrange(0, 9):
        r = row + int(i / 3)
        c = col + i % 3
        if grid[r][c] == value:
            return False
    return True

def index2Position(i):
    return int(i / 3) * 3, i % 3 * 3

def indexOfSubGrid(pos, i):
    row, col = index2Position(i)
    return (pos.row - row) * 3 + pos.col - col
