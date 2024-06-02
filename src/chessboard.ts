import * as THREE from "three"
import { Chess } from "chess.js"

import { setCorrectWidth, enableShadows } from "./utils";
import { loadModel } from "./model_loader";

export const CHESSBOARD_CELL_SIZE = 30;
export const CHESSBOARD_SIZE = CHESSBOARD_CELL_SIZE * 8;

export const PLAYER_1 = 0;
export const PLAYER_2 = 1;

export let chessboard_state = new Chess();

export let chessboard: THREE.Group<THREE.Object3DEventMap>;

export const loadChessboard = (scene: THREE.Scene, textureLoader: THREE.TextureLoader) => {
	loadModel("chessboard.glb", undefined)!.then(
		async (model) => {
			model!.traverse(async (child) => {
				if (child instanceof THREE.Mesh) {
					const map = child.material.map;
					child.material = new THREE.MeshPhysicalMaterial(
						{
							map: map,
							normalMap: await textureLoader.loadAsync(`board_normal.jpg`).then((texture) => texture),
						}
					);

					child.receiveShadow = true;
				}

				enableShadows(model!);

				setCorrectWidth(model!, CHESSBOARD_SIZE);
				model!.position.set(CHESSBOARD_SIZE / 2, 0, CHESSBOARD_SIZE / 2);
				model!.rotation.set(Math.PI * 2, 0, 0);
 	        	chessboard = model!;
				chessboard.receiveShadow = true;

				scene.add(chessboard);
			});
		}
	)
};
