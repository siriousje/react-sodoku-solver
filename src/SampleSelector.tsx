import React, { Component } from 'react';
import { Sample } from './Samples';

interface SampleSelectorProps {
    id? : number;
    samples: Sample[];
    selectionHasChanged(id: number): void;
}

interface SampleSelectorState {
    id: number
}

export default class SampleSelector extends Component<SampleSelectorProps, SampleSelectorState> {

    constructor(props: SampleSelectorProps) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.state = {
            id: props.id || 0
        };
    }

    private handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
        let id = parseInt(event.target.value, 10);
        this.setState({id: id});
        this.props.selectionHasChanged(id);
    }

    componentDidUpdate(prevProps: SampleSelectorProps) {
        if (prevProps.id !== this.props.id) {
            this.setState({id: this.props.id || 0});
        }
    }
    
    public reset = () => {
        this.setState({id: 0});
    }

    render() {
        return (
        <select value={this.state.id || 0} onChange={this.handleChange} >
            {this.props.samples.map((sample) => (
                <option key={`option_${sample.id}`} value={sample.id}>{sample.name}</option>
            ))}
        </select>
        )
    }
}