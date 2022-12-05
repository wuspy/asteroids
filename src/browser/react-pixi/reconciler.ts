/**
 * -------------------------------------------
 * Host Config file.
 *
 * See:
 *   https://github.com/facebook/react/tree/master/packages/react-reconciler
 *   https://github.com/facebook/react/blob/master/packages/react-reconciler/src/forks/ReactFiberHostConfig.custom.js
 * -------------------------------------------
 */

import { Container } from "@pixi/display";
import Reconciler from "react-reconciler";
import { ContinuousEventPriority, DiscreteEventPriority, DefaultEventPriority } from "react-reconciler/constants";
import { createElement, ReactPixiInstance } from "./element";
import { AnyProps, diffProperties, UpdatePayload } from "./props";

const NO_CONTEXT = {};

function appendChild(parent: ReactPixiInstance<Container>, child: ReactPixiInstance) {
    parent.addChild(child);

    if (child.__reactpixi.didMount) {
        child.__reactpixi.didMount(child, parent)
    }
}

function removeChild(parent: ReactPixiInstance<Container>, child: ReactPixiInstance) {
    if (child.__reactpixi.willUnmount) {
        child.__reactpixi.willUnmount(child, parent);
    }

    // unmount potential children
    if (child instanceof Container) {
        for (const grandchild of child.children) {
            if (grandchild.__reactpixi) {
                removeChild(child, grandchild);
            }
        }
    }

    if (child.__reactpixi.config.destroy) {
        child.destroy({ children : child.__reactpixi.config.destroyChildren });
    } else {
        parent.removeChild(child);
    }
}

function insertBefore(
    parent: ReactPixiInstance<Container>,
    child: ReactPixiInstance,
    beforeChild: ReactPixiInstance
) {
    const childExists = parent.children.indexOf(child) !== -1;
    const index = parent.getChildIndex(beforeChild);

    childExists ? parent.setChildIndex(child, index) : parent.addChildAt(child, index);
}

function clearContainer(container: ReactPixiInstance<Container>) {
    for (const child of container.children) {
        if ((child as ReactPixiInstance).__reactpixi) {
            removeChild(container, child as ReactPixiInstance);
        }
    }
}

function prepareUpdate(
    pixiElement: ReactPixiInstance,
    type: string,
    oldProps: AnyProps,
    newProps: AnyProps,
    rootContainerInstance: Container,
    hostContext: object,
): UpdatePayload<AnyProps> | null {
    return diffProperties(oldProps!, newProps!);
}

function commitUpdate<Props extends Record<string, any>>(
    instance: ReactPixiInstance,
    updatePayload: UpdatePayload<Props>,
    type: string,
    oldProps: Props,
    newProps: Props,
): void {
    instance.__reactpixi.applyProps(instance, updatePayload);
}

function getEventPriority() {
    if (typeof window === "undefined") {
        return DefaultEventPriority;
    }

    switch (window.event?.type) {
        case "click":
        case "contextmenu":
        case "dblclick":
        case "pointercancel":
        case "pointerdown":
        case "pointerup":
            return DiscreteEventPriority;
        case "pointermove":
        case "pointerout":
        case "pointerover":
        case "pointerenter":
        case "pointerleave":
        case "wheel":
            return ContinuousEventPriority;
        default:
            return DefaultEventPriority;
    }
}

export const PixiFiber = Reconciler({
    getRootHostContext() {
        return NO_CONTEXT;
    },

    getChildHostContext() {
        return NO_CONTEXT;
    },

    getPublicInstance(instance) {
        return instance;
    },

    prepareForCommit() {
        // noop
        return null;
    },

    resetAfterCommit() {
        // noop
    },

    createInstance: createElement,

    hideInstance(instance: ReactPixiInstance) {
        instance.visible = false;
    },

    unhideInstance(instance: ReactPixiInstance, props: AnyProps) {
        instance.visible = "visible" in props ? props.visible : true;
    },

    finalizeInitialChildren() {
        return false;
    },

    prepareUpdate,

    prepareScopeUpdate() {
        // noop
    },

    getInstanceFromScope() {
        return null;
    },

    shouldSetTextContent() {
        return false;
    },

    // shouldDeprioritizeSubtree(type, props) {
    //   const isAlphaVisible = typeof props.alpha === 'undefined' || props.alpha > 0
    //   const isRenderable = typeof props.renderable === 'undefined' || props.renderable === true
    //   const isVisible = typeof props.visible === 'undefined' || props.visible === true

    //   return !(isAlphaVisible && isRenderable && isVisible)
    // },

    createTextInstance(text: string) {
        throw new Error(`Text instance not supported (at '${text}')`);
    },

    unhideTextInstance() {
        // noop
    },

    scheduleTimeout: setTimeout,

    cancelTimeout: clearTimeout,

    noTimeout: -1,

    warnsIfNotActing: false,

    isPrimaryRenderer: true,

    supportsMutation: true,

    supportsPersistence: false,

    supportsHydration: false,

    supportsMicrotask: true,

    /**
     * -------------------------------------------
     * Mutation
     * -------------------------------------------
     */

    appendChild,

    appendInitialChild: appendChild,

    appendChildToContainer: appendChild,

    removeChild,

    removeChildFromContainer: removeChild,

    insertBefore,

    insertInContainerBefore: insertBefore,

    commitUpdate,

    commitMount() {
        // noop
    },

    commitTextUpdate() {
        // noop
    },

    resetTextContent() {
        // noop
    },

    clearContainer,

    getInstanceFromNode() {
        throw new Error('Not yet implemented.')
    },

    beforeActiveInstanceBlur() {
        // noop
    },

    afterActiveInstanceBlur() {
        // noop
    },

    preparePortalMount(portalInstance) {
        // noop
    },

    detachDeletedInstance: () => {
        // noop
    },

    getCurrentEventPriority: getEventPriority,
});
