// typescript can't import .svg files without making a custom type declaration
// so when you see cannot find module './logo.svg' you add this
declare module "*.svg" {
    import React from "react"
    export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement> &  { title?: string} >
    const src: string;
    export default src;
}