import React from 'react';

export class ParentComponent extends React.Component {

  render() {
    debugger;
    return (
      <div className="parent">
        parent
        {this.props.children}
      </div>
    );
  }
}
