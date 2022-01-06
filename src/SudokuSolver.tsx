import { deepCopy } from "./utilities";
import { logBoard } from "./SudokuDebugger";

/**
 * Comparable objects need to implement equals.
 */
export interface Comparable<T> {
    equals(object: T): boolean;
}

/**
 * We can then create a ComparableSet that checks the equals by
 * overriding the has and add methods.
 */
export class ComparableSet<T extends Comparable<T>> extends Set<T> {

    constructor(...values: T[]) {
        super(values);
    }
    
    has = (other: T) => {
        if (other === undefined || other === null) {
            return false;
        }
        for (let value of this.values()) {
            if (value.equals(other)) {
                return true;
            }
        }
        return false;
    }

    add = (value: T) => {
        if (!this.has(value) && value !== undefined && value !== null) {
            super.add(value);
        }
        return this;
    }
}

/**
 * We need to compare Cells to filter them out of a list. I created
 * this cell as Comparable to make sure that when added to our Set
 * we only get unique ones. This is then used in the
 */
export class Cell implements Comparable<Cell> {

    private row: number;
    private col: number;

    constructor(row: number, col: number) {
        this.row = row;
        this.col = col;
    }

    getRow(): number {
        return this.row;
    }
    getCol(): number {
        return this.col;
    }
    
    equals(other: Cell): boolean {
        return other !== undefined 
                && other !== null 
                && other.getRow() === this.row 
                && other.getCol() === this.col;
    }
}

/**
 * This SudokuSolver tries to solve the sudoku first using simple logic just as 
 * a human would do, i.e., put all possible values in pencil in the cell, then
 * check the row, cell or square to see if it's the only one and if so, fill it in.
 * 
 * To make it less reliant on brute force recursion, I still like to implement 
 * more techniques from https://sudokuprimer.com/techniques.php
 * 
 */
export class SudokuSolver {

    /**
     * Returns a column from the board, unlike getting a row we can't do this without
     * iteration over all the rows and grabbing the cells.
     * 
     * @param board 
     * @param col 
     * @returns 
     */
    private getColumn(board: number[][], col: number) : number[] {
        var cells = [];
        for (let r = 0; r < 9; r++) {
            cells.push(board[r][col]);
        }
        return cells;
    }

    /**
     * so the board is also divided in 9 squares we need to check:
     * 
     * 0 1 2
     * 3 4 5
     * 6 7 8
     * 
     * this method returns the square number for any (row,col) combination
     */
    private getSquareNum(row: number, col: number) : number {
        return Math.floor(row / 3) * 3 + Math.floor(col / 3) ;
    }

    /**
     * Returns the 9 cells that make up a square using the getSquareNum(r, c)
     * 
     * @param board 
     * @param square 
     * @returns number[]
     */
    private getSquare(board: number[][], square: number) : number[] {
        let cells = []
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (square === this.getSquareNum(r, c)) {
                    cells.push(board[r][c])
                }
            }
        }
        return cells
    }

    /**
     * Checks the cells of a row, column or square to have all the 9 
     * numbers 1 through 9
     * 
     * @param cells 
     * @returns 
     */
    private checkCells(cells: number[]) : boolean {
        if (cells.length !== 9) {
            return false;
        }
        // use slice to get a copy because sort will change it
        let sortedCells = deepCopy(cells).sort();
        for (let i = 0; i < 9 ; i++) { // once sorted it must be [1, 2...9]
            if (sortedCells[i] !== i + 1) {
                return false;
            }
        }
        return true;
    }

    /**
     * Need to check all rows, columns and squares
     * 
     * @param board number[][]
     * @returns boolean
     */
    private isSolved(board: number[][]) : boolean {
        try {
            for (let i = 0; i < 9; i++) {
                if (!this.checkCells(board[i])) {
                    return false;
                }
                if (!this.checkCells(this.getColumn(board, i))) {
                    return false;
                }
                if (!this.checkCells(this.getSquare(board, i))) {
                    return false;
                }
            }
            return true;
        } catch (error) {
            console.log("board", board);
            console.log(error);
            return false;
        }
    }

    /**
     * This method checks a group of cells (the values from a line or square) to
     * collect the values that are double. We just return the positions since 
     * we don't know where exactly they are as we don't know if we're a line or a square...
     * 
     * @param cells 9 cells to check (could be row, col or square)
     * @returns number[] with the index of the doubles
     */
    private checkDoubles = (cells: number[]) : number[] => {
        // first find any value that is duplicated, skip 0
        let duplicates: Set<number> = new Set(cells.filter((item, index) => item !== 0 && cells.indexOf(item) !== index));
        // then return the positions of these duplicates
        let doubles: number[] = [];
        for (let i = 0 ; i < 9 ; i++) {
            if (duplicates.has(cells[i])) {
                doubles.push(i);
            }
        }
        return doubles;
    }

    /**
     * Uses the checkDoubles method to first find doubles for the lines (row and col)
     * and turns these into Cell objects that are added to a Set so we only keep the 
     * unique Cells/coordinates.
     * 
     * @param board number[][] the entire board
     * @returns 
     */
    public findErrors(board: number[][]) : ComparableSet<Cell> | boolean {
        let cells = new ComparableSet<Cell>();
        // for rows and columns we can just go once along each axis
        for (let i = 0; i < 9; i++) {
            this.checkDoubles(board[i]).forEach((c) => {
                cells.add(new Cell(i, c));
            });
            this.checkDoubles(this.getColumn(board, i)).forEach((r) => {
                cells.add(new Cell(r, i));
            });
        }
        // for squares it's tricker because each position you find, you need to translate the
        // square back to a base quadrant. so square 8 starts at (6, 6) etc. However, since
        // we're checking the square, we can skip 3 on each row and col and use those r, c as
        // the top right corner of the square.
        for (let r = 0; r < 9 ; r += 3) {
            for (let c = 0; c < 9; c += 3) {
                this.checkDoubles(this.getSquare(board, this.getSquareNum(r, c))).forEach((i) => {
                    cells.add(new Cell(r + Math.floor(i / 3), c + (i % 3)));
                });
            }
        }

        return cells.size > 0 
            ? cells 
            : false;
    }

    /**
     * Tries to calculate the option for a cell. If there was only 1 valid option for a cell, return true, 
     * otherwise put all the options in the cell for future reference and return false.
     * 
     * board is any type because I don't know how to express number[][] -> (number | number[])
     * @param board 
     * @param row 
     * @param col 
     * @returns boolean
     */
    private calculateOptions(board: any[][], row: number, col: number) : boolean {
        // create a set of all the used numbers from each row/col/square
        let invalid = new Set<number>([...board[row], ...this.getColumn(board, col), ...this.getSquare(board, this.getSquareNum(row, col))]);
        let options = []
        // not sure how to do a quick complement of invalid with [1..9] so just iterate
        for (let i = 1; i <= 9; i++) {
            if (!invalid.has(i)) {
                options.push(i)
            }
        }
        // if there's only one, fill it out and be happy
        if (options.length === 1) {
            board[row][col] = options[0]
            return true
        } 

        board[row][col] = options
        return false
    }

    /**
     * Compares a list of options with cells to count how many of the options can fit the cells
     * If the count is just 1, we know that it's the only valid option and we can use it to update
     * the board. We know the cell contains an array.
     * 
     * @param board any because I have no idea how to say number[][] | number[][][]
     * @param row 
     * @param col 
     * @param cells the other cells to test with the options in the current cell
     * @returns 
     */
    private updateIfOnlyOption(board: any, row: number, col: number, cells: any) {
        for (let option of board[row][col]) {
            let count = 0
            for (let cell of cells) {
                if ((Array.isArray(cell) && cell.includes(option)) || cell === option) {
                    count++;
                }
            }
            if (count === 1) { // if exactly one, then this is the one!
                board[row][col] = option
                return true;
            }
        }
        return false;
    }

    /**
     * Now, using above two methods, the first run is to solve all the single value cells to make
     * the board easier. Even if it doesn't solve the board, it will create less recursion options
     * if even just one cell is changed.
     * 
     * @param board any because you know...
     * @returns boolean
     */
     private solveSingleValueCells(board: any) : boolean {
        
        let changed = false;

        // fill out each cell with either a value or the array of options
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) {
                    if (this.calculateOptions(board, r, c)) {
                        changed = true;
                    }
                }
            }
        }
        // now for all the arrays in the cells we can update if it's the only option
        // for that row, column or square
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (Array.isArray(board[r][c])) {
                    // since getting a row is the cheapest, we start with that. If that changes the cell
                    // then we don't need to do the others and so on. square last because that is
                    // the most expensive operation.
                    if (this.updateIfOnlyOption(board, r, c, board[r]) 
                        || this.updateIfOnlyOption(board, r, c, this.getColumn(board, c)) 
                        || this.updateIfOnlyOption(board, r, c, this.getSquare(board, this.getSquareNum(r,c)))) {
                            changed = true;
                        };
                }
            }
        }
        // make sure to reset all the arrays left by calculateOptions before we create copies for recursion
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (Array.isArray(board[r][c])) {
                    board[r][c] = 0;
                }
            }
        }
        return changed;
    }

    /**
     * recurses over the board by trying a move and then going deeper to see if that
     * solves the board. If the options don't work out, the board it's working on
     * is invalid so we can have an early exit for that particular board.
     * 
     * if we get to the end without returning a board then there's not enough information
     * or the board is invalid.
     * 
     * @param board 
     * @returns board or false
     */
    private recurseSolveBoard(board: any) : any {
        let copy = deepCopy(board);

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (copy[r][c] === 0) { // cell is not filled out
                    // it makes no sense to check for solved if calculateOptions didn't return true
                    if (this.calculateOptions(copy, r, c) && this.isSolved(copy)) {
                        return copy;
                    }
                    // calculateOptions will have left an array in the cell for all the options we can try
                    // if it's a number then the cell has been solved
                    let cell = copy[r][c];
                    if (Array.isArray(cell)) {
                        // recurse into all the options until we have a solved board
                        for (let i = 0; i < cell.length; i++) {
                            let recurseCopy = deepCopy(copy);
                            recurseCopy[r][c] = cell[i]
                            let solved = this.recurseSolveBoard(recurseCopy)
                            if (solved) {
                                return solved;
                            }
                        }
                        return false; // none of the options worked so the entire board is invalid
                    }
                }
            }
        }
        return false; // not found anything for this board
    }

    /**
     * Combines the above to solve the board
     * @returns a board if solved, or false if it can't be solved
     */
    public solve(board: number[][]) : number[][] | boolean {

        let changed = true;

        while (changed) {
            changed = this.solveSingleValueCells(board);
            if (this.isSolved(board)) {
                return board;
            }
        }
        // no more changes but still not solved :-(, time to go recursive
        let solved = this.recurseSolveBoard(board);
        if (solved && this.isSolved(solved)) {
            return solved;
        } else {
            console.log("Cannot solve board!");
            logBoard(board);
            this.findErrors(board);
        }
        return false;
    }
}

/**
 * if you don't care about creating a solver but just want to use it, use this
 * 
 * @param board board[][]
 * @returns either the board or false
 */
export function solve(board: number[][]) : number[][] | boolean {
    let sudokuSolver = new SudokuSolver();
    return sudokuSolver.solve(board);
}

