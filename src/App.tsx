import React, { Component } from "react";
import './App.css';

interface Props {
  board: React.ReactNode;
}

export default class App extends Component<Props> {

  private board: React.ReactNode;

  constructor(props: Props) {
    super(props);
    this.board = props.board;
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Sudoku Solver</h1>
          <div className="board-div">
            {this.board}
          </div>
        </header>
      </div>
    );
  } 
}
