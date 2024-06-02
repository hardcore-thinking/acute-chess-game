import * as THREE from 'three';

export const enableShadows = (object: THREE.Group<THREE.Object3DEventMap>) => {
    for (let child of object.children) {
		if (child instanceof THREE.Mesh) {
			child.castShadow = true;
			child.receiveShadow = true;
		}
	}

	object.castShadow = true;
	object.receiveShadow = true;
}

export const setCorrectWidth = (object: THREE.Group<THREE.Object3DEventMap>, wantedSize : number) => {
	const bounds = new THREE.Vector3();
	new THREE.Box3().setFromObject(object).getSize(bounds);
	const newScale : number = wantedSize / bounds.x;

	object.scale.set(newScale, newScale, newScale);
}