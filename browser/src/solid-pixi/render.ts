import { createRenderer } from 'solid-js/universal';
import { Container } from '@pixi/display';
import { createPixiElement, SolidPixiInstance } from './element';
import { JSX } from "solid-js"
import { PlaceholderNode } from './PlaceholderNode';

export const {
    render,
    effect,
    memo,
    createComponent,
    createElement,
    createTextNode,
    insertNode,
    insert,
    spread,
    setProp,
    use,
    mergeProps,
} = createRenderer<SolidPixiInstance>({
    createElement: createPixiElement,
    setProperty(node, name, newValue, oldValue) {
        node.__solidpixi.setProp(node, name, newValue, oldValue);
    },
    insertNode(parent: SolidPixiInstance<Container>, node, anchor) {
        if (anchor) {
            parent.addChildAt(node, parent.children.indexOf(anchor));
        } else {
            parent.addChild(node);
        }
        node.__solidpixi.didMount(node);
    },
    removeNode(parent, node) {
        const destroyOptions = node.__solidpixi.willUnmount(node);
        parent.removeChild(node);
        node.destroy(destroyOptions);
    },
    getParentNode(node) {
        return node.parent as SolidPixiInstance<Container>;
    },
    getFirstChild(node: SolidPixiInstance<Container>) {
        return node.children.find(child => "__solidpixi" in child) as SolidPixiInstance;
    },
    getNextSibling(node) {
        const children = node.parent?.children;
        for (let i = children.indexOf(node) + 1; i < children.length; i++) {
            if ("__solidpixi" in children[i]) {
                return children[i] as SolidPixiInstance;
            }
        }
    },
    createTextNode(value) {
        if (value && process.env.NODE_ENV === "development") {
            console.error("Text nodes are not supported in the PixiJS renderer. Wrap your text in an explicit <text> element instead.");
            console.error(`Instead of:\n\n  - '${value}'\n\nuse:\n\n  - '<text text="${value}" style={{ ... }} />'`);
        }
        // null/undefined produces text!! nodes in solid, so even though text nodes
        // aren't supported we still have to handle this.
        return new PlaceholderNode();
    },
    replaceText(textNode, value) {
        // noop
    },
    isTextNode(node) {
        return node instanceof PlaceholderNode;
    },
}) as unknown as ReturnType<typeof createRenderer<JSX.Element | Container>>;
