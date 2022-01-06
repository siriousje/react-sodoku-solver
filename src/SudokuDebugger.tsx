// only import these if you wish to debug the boards
import { sampleBoardSetups, Sample } from "./Samples";
import { solve } from "./SudokuSolver";
import { deepCopy } from "./utilities";

export class SudokuDebugger {

    /**
     * Writes a board to console
     * @param board 
     */

    public logBoard(board: number[][]) {
        for (let r: number = 0; r < 9; r++) {
            let row = board[r]
            
            if (r % 3 === 0) {
                console.log("+-------+-------+-------+")
            }

            let line: string = "";
            for (let c: number = 0; c < 9 ; c++) {
                if (c % 3 === 0) {
                    line += "| ";
                }
                let value = Array.isArray(row[c]) || row[c] === 0 ? " " : row[c];
                line += `${value} `;
            }
            line += "|"
            console.log(line)
        }
        console.log("+-------+-------+-------+")
    }
    
    /**
     * Finds a board by the id it has in the samples
     * @param id number
     * @returns Sample or nothing
     */
    private findById(id: number) : Sample | null {
        for (let sample of sampleBoardSetups) {
            if (sample.id === id) {
                return deepCopy(sample);
            }
        }
        return null;
    }

    /**
     * Debugs a series of samples or all
     * @param ids 
     */
    public debugBoards(...ids: number[]) {
        var samples: Sample[] = [];
    
        if (ids.length === 0) {
            samples = deepCopy(sampleBoardSetups);
        } else {
            for (let id of ids) {
                let sample = this.findById(id);
                if (sample !== null) {
                    samples.push(sample);
                } else {
                    console.log(`no sample found for id ${id}`);
                }
            }
        }
        for (var sample of samples) {
            let title = `\nGame ${sample.id} - ${sample.name}`;
            this.debugBoard(sample.board, title);
        }
    }

    /**
     * Debugs a board, can be used for custom ones
     * @param board 
     * @param title 
     */
    public debugBoard(board: number[][], title?: string) {
        if (title) {
            console.log(title);
        } else {
            console.log(`\nInput:`)
        }
        this.logBoard(board)
        console.log("\nSolved:")
        let copy = deepCopy(board);
        let start = performance.now();
        let solved = solve(copy);
        let duration = (performance.now() - start).toFixed(2);
        if (solved) {
            this.logBoard(solved as number[][]);
            console.log(`solution took ${duration}ms`);
        } else {
            console.log("Can't solve this board!");
            this.logBoard(copy);
        }
    }
}

/**
 * Debugs the sample boards. If ids are provided only those.
 * @param ids 
 */
export function debugBoards(...ids: number[]) {
    const sudokuDebugger: SudokuDebugger = new SudokuDebugger();
    sudokuDebugger.debugBoards(...ids);
}

/**
 * Helpers to log a board
 * @param board
 */
export function logBoard(board: number[][]) {
    const sudokuDebugger: SudokuDebugger = new SudokuDebugger();
    sudokuDebugger.logBoard(board);
}