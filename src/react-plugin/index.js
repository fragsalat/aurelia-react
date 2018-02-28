import {noView, customElement, bindable, children} from 'aurelia-templating';
import {decorators} from 'aurelia-metadata';
import React from 'react';
import {render} from 'react-dom';

/**
 * Configure the aurelia loader to use handle urls with !component
 * @param {FrameworkConfiguration} config
 */
export function configure(config) {
  const loader = config.aurelia.loader;
  loader.addPlugin('react-component', {
    fetch(address) {
      return loader.loadModule(address)
        .then(getComponents);
    }
  });
}

/**
 * Extract the components from the loaded module
 * @param {Object} module Object containing all exported properties
 * @returns {Object}
 */
export function getComponents(module) {
  return Object.keys(module).reduce((elements, name) => {
    if (typeof module[name] === 'function') {
      const elementName = camelToKebab(name);
      elements[elementName] = wrapComponent(module[name], elementName);
    }
    return elements;
  }, {});
}

/**
 * Converts camel case to kebab case
 * @param {string} str
 * @returns {string}
 */
function camelToKebab(str) {
  // Matches all places where a two upper case chars followed by a lower case char are and split them with an hyphen
  return str.replace(/([a-zA-Z])([A-Z][a-z])/g, (match, before, after) =>
    `${before.toLowerCase()}-${after.toLowerCase()}`
  ).toLowerCase();
}

/**
 * Wrap the React components into an ViewModel with bound attributes for the defined PropTypes
 * @param {Object} component
 * @param {string} elementName
 * @returns {Object}
 */
function wrapComponent(component, elementName) {
  let bindableProps = [];
  if (component.propTypes) {
    bindableProps = Object.keys(component.propTypes).map(prop => bindable({
      name: prop,
      attribute: camelToKebab(prop),
      changeHandler: 'attached',
      defaultBindingMode: 1
    }));
  }
  return decorators(
    noView(),
    customElement(elementName),
    bindable({name: 'props', attribute: 'props', changeHandler: 'attached', defaultBindingMode: 1}),
    ...bindableProps
  ).on(createWrapperClass(component));
}

/**
 * Create a wrapper class for the component
 * @param {Object} component
 * @returns {WrapperClass}
 */
function createWrapperClass(component) {
  return class WrapperClass {
    static inject = [Element];

    /**
     * @param {Element} element
     */
    constructor(element) {
      this.element = element;
      this.children = [];
    }

    /**
     * Re-render the Preact component when values changed
     */
    bind(bindingContext) {
      if (bindingContext.reactParent) {
        bindingContext.reactParent.addChild(this);
      } else {
        this.isParent = true;
      }
      bindingContext.reactParent = this;
    }

    /**
     * Re-render the Preact component when values changed
     */
    attached() {
      if (this.isParent) {
        render(this.createElement(), this.element);
      }
    }

    addChild(child) {
      this.children.push(child);
    }

    /**
     * Render Preact component
     */
    createElement() {
      debugger;
      const props = this.props || {};
      // Copy bound properties because Object.assign doesn't work deep
      for (const prop in this) {
        if (this[prop] !== undefined && typeof this[prop] !== 'function') {
          props[prop] = this[prop] === '' ? true : this[prop];
        }
      }
      return React.createElement(
        component,
        props,
        this.children.map(vm => vm.createElement())
      );
    }
  };
}
