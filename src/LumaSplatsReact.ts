import { Object3DNode, extend } from '@react-three/fiber';
import { LumaSplatsThree } from "@lumaai/luma-web";

// Make LumaSplatsThree available to R3F
extend( { LumaSplats: LumaSplatsThree } );

// For typeScript support:
declare module '@react-three/fiber' {
  interface ThreeElements {
    lumaSplats: Object3DNode<LumaSplatsThree, typeof LumaSplatsThree>
  }
}