import React, { Component, FocusEvent } from "react";
import "./Board.css"
import { deepCopy } from "./utilities";
import "./SudokuSolver"
import SampleSelector from "./SampleSelector";
import { sampleBoardSetups, findById } from './Samples';
// to prevent namespace collisions we rename the Cell to ComparableCell
import { SudokuSolver, ComparableSet, Cell as ComparableCell } from "./SudokuSolver";

// always useful to reset a board. Easier to use with deepCopy than creating 
const emptyBoard = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]
];

/**
 * Cell Properties, it needs to know where it sits, the value and
 * a callback to the parent to let it know the value was updated.
 * Also change the UI if the item is a duplicate
 */
interface CellProps {
    row: number;
    col: number;
    value: number;
    cellHasChanged(row: number, col: number, value: number): void;
    duplicate: boolean;
}
/**
 * Keeps nothing more than just the value
 */
interface CellState {
    value: number;
}
/**
 * Row Properties, needs to know the row number and the cells.
 * Has a callback to the board to pass on the message from 
 * the Cell. Gets the duplicates from the board.
 */
interface RowProps {
    row: number;
    cells: number[];
    cellHasChanged(row: number, col: number, value: number): void;
    duplicates: ComparableSet<ComparableCell> | boolean;
}

/**
 * Board just doesn't have that many props, perhaps an initial board to start with
 */
interface BoardProps {
    board?: number[][];
}

/**
 * BoardState has the id of the sample if selected, the board obviously
 * if there's an error or if we need to show a message and a set of duplicates
 */
interface BoardState {
    id?: number;
    board: number[][];
    error?: string;
    message?: string;
    duplicates: ComparableSet<ComparableCell> | boolean; 
}

/**
 * Cell draws a single cell. it has a value or is 0, in which case it will
 * not draw the 0 but just and empty break
 */
class Cell extends Component<CellProps, CellState> {

    constructor(props: CellProps) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.handleFocus = this.handleFocus.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.state = {
            value: props.value || 0
        }
    }

    /**
     * Selects the text in the box
     * @param event 
     */
    private handleFocus(event: FocusEvent<HTMLInputElement>): void {
        event.target.select();
    }

    /**
     * Tells the parent component that this component has updated the
     * value. Eventually, the value will come back down via props.
     * @param event 
     */
    private handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
        let value: number = parseInt(event.target.value, 10) || 0;
        this.props.cellHasChanged(this.props.row, this.props.col, value);
    }

    /**
     * Prevent anything else but numbers 1 to 9 in the box
     * @param event 
     */
    private handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>): void => {
        event.currentTarget.value = event.currentTarget.value.replace(/[\D0]/g, '');
    }
    
    render() {
        // the key determines if the element is re-rendered, so it has to be unique
        let key = "" + this.props.row + "x" + this.props.col + "_" + this.props.value;
        let className = "sudoku_cell";
        if (this.props.duplicate) {
            className += " duplicate";
        }
        return (
            <td className={className}>
                <input type="text" 
                    key={`input_${key}`}
                    defaultValue={this.props.value === 0 ? "" : this.props.value} 
                    maxLength={1} 
                    onFocus={this.handleFocus}
                    onChange={this.handleChange}
                    onKeyUp={this.handleKeyUp}
                />
            </td>
        )
    }
}

/**
 * Rows take the data for the cells or creates a new array with 0s
 * It draws cells for each Cell. It doesn't really need state of its own.
 */
class Row extends React.Component<RowProps> {

    render() {
        let keyPrefix = "cell_" + this.props.row + "x";
        
        return (
            <>
                <tr className="sudoku_row">
                    {this.props.cells.map((cell, id) => {
                        let thisCell = new ComparableCell(this.props.row, id);
                        let duplicate = this.props.duplicates && (this.props.duplicates as ComparableSet<ComparableCell>).has(thisCell);
                        return (
                            <Cell 
                                key={`${keyPrefix + id}`} 
                                row={this.props.row}
                                col={id}
                                value={this.props.cells[id]} 
                                cellHasChanged={this.props.cellHasChanged}
                                duplicate={duplicate}
                            />
                        );
                        })}
                </tr>
            </>
        )
    }
}

/**
 * The main board draws the rows, handles the sample selector etc.
 */
export default class Board extends Component<BoardProps, BoardState> {

    state: BoardState = {
        id: 0,
        board: deepCopy(emptyBoard),
        duplicates: false
    }

    private sudokuSolver = new SudokuSolver();

    constructor(props: BoardProps) {
        super(props);
        this.clear = this.clear.bind(this);
        this.solve = this.solve.bind(this);

        if (props.board) {
            this.state = { 
                board: deepCopy(props.board),
                duplicates: this.sudokuSolver.findErrors(props.board)
            };
        } else {
            this.state = {
                board: deepCopy(emptyBoard),
                duplicates: false
            }
        }

    }

    /**
     * Passed down into the Cell to inform the Board that a Cell was changed.
     * @param row number
     * @param col number
     * @param value number
     */
    private cellHasChanged = (row: number, col: number, value: number) : void => {
        let board = deepCopy(this.state.board);
        board[row][col] = value;
        // we know which cell was changed, so we only need to check that row, col and square
        let duplicates = this.sudokuSolver.findErrors(board);
        this.setState({
            board: board,
            duplicates: duplicates
        });
    }

    /**
     * When the selection changes, the id changes and we can get a different Sample
     * @param id number
     */
    private changeSelection = (id: number) : void => {
        let sample = findById(id);
        if (sample) {
            this.setState({
                id: sample.id,
                board: deepCopy(sample.board),
                error: undefined,
                message: undefined,
                duplicates: false
            });
        }
    }

    /**
     * Resets the board by simply selecting the 0th option
     */
    private clear() {
        this.changeSelection(0);
    }

    /**
     * Solves the boards, times the solution and complains about errors
     * Obviously, the solve button is disabled when obvious duplicates
     * are found to prevent us from going on a useless recursion.
     */
    private solve() {

        let start = performance.now();
        let result = this.sudokuSolver.solve(this.state.board);
        let duration = (performance.now() - start).toFixed(2);

        if (result) {
            this.setState({
                board: result as number[][],
                message: `board solved in ${duration} ms`
            })
        } else {
            let duplicates = this.sudokuSolver.findErrors(this.state.board);
            if (duplicates) {
                this.setState({
                    message: undefined,
                    error: 'This board is invalid, please check the duplicates!',
                    duplicates: duplicates
                })                
            } else {
                this.setState({
                    message: undefined,
                    error: 'This board is invalid. There must be a mistake causing a deadlock, remove values until deadlock is solved',
                    duplicates: false
                })
            }
        }
    }

    render() {
        let disabled = this.state.duplicates ? true : false;
        return (
            <>
            <div>
                <table className="sudoku">
                    <tbody>
                        {this.state.board.map((row, id) => (
                            <Row key={`row_${id}`} 
                                cells={row} 
                                row={id} 
                                cellHasChanged={this.cellHasChanged} 
                                duplicates={this.state.duplicates}
                            />
                        ))} 
                    </tbody>
                </table>
                <button className="solve-button" onClick={this.solve} disabled={disabled}>Solve</button>
                <button className="clear-button>" onClick={this.clear}>Clear</button>
            </div>
            {this.state.message && (
                <div className="message-div">{this.state.message}</div>
            )}
            {this.state.error && (
                <div className="error-div">{this.state.error}</div>
            )}
            <div className="selector-div">
                select sample board: <SampleSelector 
                    samples={sampleBoardSetups} 
                    id={this.state.id} 
                    selectionHasChanged={this.changeSelection}
                    />
            </div>
            </>
        )
    }
}