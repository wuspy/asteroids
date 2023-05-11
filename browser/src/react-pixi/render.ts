import { PixiFiber } from './reconciler'
import { ConcurrentRoot } from 'react-reconciler/constants'
import { Container } from '@pixi/display'
import { ReactNode } from 'react';
import { ReactPixiInstance } from './element';
import { applyDefaultProps } from './props';

const roots = new Map<Container, any>();
let injected = false;

function unmountComponent(container: Container) {
    if (roots.has(container)) {
        // unmount component
        PixiFiber.updateContainer(null, roots.get(container), undefined, () => {
            roots.delete(container)
        });
    }
}

/**
 * Custom Renderer with react 18 API
 * Use this without React-DOM
 */
export function createRoot(container: Container) {
    if (roots.has(container)) {
        throw new Error("pixi-react: createRoot should only be called once");
    }
    (container as ReactPixiInstance<Container>).__reactpixi = {
        root: container as ReactPixiInstance<Container>,
        applyProps: applyDefaultProps,
        config: { destroy: false, destroyChildren: false },
    };
    // @ts-ignore
    const root = PixiFiber.createContainer(
        container as ReactPixiInstance<Container>,
        ConcurrentRoot,
        null,
        false
    );
    roots.set(container, root);

    if (!injected) {
        PixiFiber.injectIntoDevTools({
            bundleType: process.env.NODE_ENV !== "production" ? 1 : 0,
            version: process.env.npm_package_version!,
            rendererPackageName: "react-pixi",
        });
        injected = true;
    }

    return {
        render(element: ReactNode) {
            // schedules a top level update
            PixiFiber.updateContainer(element, root, undefined);

            return PixiFiber.getPublicRootInstance(root);
        },
        unmount() {
            unmountComponent(container);
            roots.delete(container);
        },
    };
}
