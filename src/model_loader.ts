import * as THREE from 'three';

import { OBJLoader } from "three/examples/jsm/Addons.js";
import { GLTF, GLTFLoader } from "three/examples/jsm/Addons.js";
import { FBXLoader } from "three/examples/jsm/Addons.js";

const objLoader = new OBJLoader();
const gltfLoader = new GLTFLoader();
const fbxLoader = new FBXLoader();

export const loadModel = async (fileName : string, fileUrl : string | null = null) => {
    let loader : OBJLoader | GLTFLoader | FBXLoader | null;

    const isOBJ : boolean = fileName.toLowerCase().endsWith(".obj");
    const isGLTF : boolean = fileName.toLowerCase().endsWith(".gltf") || fileName.toLowerCase().endsWith(".glb");
    const isFBX : boolean = fileName.toLowerCase().endsWith(".fbx");

    if (isOBJ) {
        console.log("Type: OBJ");
	    loader = objLoader;
    }

    else if (isGLTF) {
	    console.log("Type: GLB/GLTF");
	    loader = gltfLoader;
    }

    else if (isFBX) {
	    console.log("Type: FBX");
	    loader = fbxLoader;
    }

    else {
        console.log("Unsupported Type");
        loader = null;
    }

    const onfullfilled = (model: THREE.Group<THREE.Object3DEventMap> | GLTF) => {
        let tmpModel : THREE.Group<THREE.Object3DEventMap>;
		if (model instanceof THREE.Group) {
			tmpModel = model;
		}

		else {
			tmpModel = model.scene;
        }

        return tmpModel;
    };

    const onrejected = (error: any) => {
        console.log(`Something went wrong while trying to load the model: ${error}`);

        return null;
    };

    if (loader !== null) {
        if (fileUrl !== null) {
            return loader!.loadAsync(fileUrl).then(onfullfilled, onrejected);
        }

        else {
            return loader!.loadAsync(fileName).then(onfullfilled, onrejected);
        }
    } 

    return null;
};

