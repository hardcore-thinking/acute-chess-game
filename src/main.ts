import * as THREE from "three";

import { EffectComposer, OutlinePass, OutputPass, RenderPass } from "three/examples/jsm/Addons.js";

import Stats from "three/examples/jsm/libs/stats.module.js";

import * as CHESSBOARD from "./chessboard"
import * as PIECES from "./pieces";

const RENDERER_WIDTH : number = window.innerWidth;
const RENDERER_HEIGHT : number = window.innerHeight;

async function main() {
	const stats = new Stats();
	document.body.appendChild(stats.dom);

	const history = <HTMLDivElement> document.querySelector("#game-state-history");

	const addHistory = (message: string) => {
		const newState = document.createElement("p");
		newState.className = "history-text";
		newState.innerHTML = message;
		history.append(newState);
		history.scrollTop = history.scrollHeight;
	};

	addHistory("Welcome to Acute Chess ! To start playing, first move the cursor, at the center of the screen, to the piece you want to move. Then click on the piece. Finally click the cell you want it to move onto. Have fun !");

	let gameOver = false;
	let turns = 1;

	const canvas = <HTMLCanvasElement> document.querySelector("#main-canvas");

	canvas.height = window.innerHeight;

	const RENDERER_INIT_PARAMS = {
		antialias: true,
		canvas: canvas,
	};
	let renderer = new THREE.WebGLRenderer(RENDERER_INIT_PARAMS);
	renderer.shadowMap.enabled = true;
	renderer.setSize(RENDERER_WIDTH, RENDERER_HEIGHT);

	const crosshair = <HTMLImageElement> document.querySelector("#crosshair");

	crosshair.width = 15; 
	crosshair.height = 15;
	crosshair.style.left = `${renderer.domElement.width / 2 - crosshair.width / 2}px`;
	crosshair.style.top = `${renderer.domElement.height / 2 - crosshair.height / 2}px`;

	let scene = new THREE.Scene();
	let textureLoader = new THREE.TextureLoader();
	let texture : THREE.Texture = textureLoader.load(
		"forest.jpg",
		() => {
			texture.mapping = THREE.EquirectangularReflectionMapping;
      		texture.colorSpace = THREE.SRGBColorSpace;
      		scene.background = texture;
		}
	)

	const CAMERA_INIT_PARAMS = {
		fov: 60,
		aspect: RENDERER_WIDTH / RENDERER_HEIGHT,
		near: 0.1,
		far: 4096,
	};
	let camera = new THREE.PerspectiveCamera(CAMERA_INIT_PARAMS.fov, CAMERA_INIT_PARAMS.aspect, CAMERA_INIT_PARAMS.near, CAMERA_INIT_PARAMS.far);

	new THREE.WebGLRenderer().compile(scene, camera);

	const CAMERA_HEIGHT = 280;

	camera.position.x = 120;
	camera.position.y = CAMERA_HEIGHT;
 	camera.position.z = -80;

	camera.lookAt(new THREE.Vector3(120, 0, 120));
	let cameraRotation = new THREE.Euler(camera.rotation.x, camera.rotation.y, camera.rotation.z, 'YXZ');
	
	scene.add(camera);

	const resizeViewport = () => {
		let newWidth : number = window.innerWidth;
		let newHeight : number = window.innerHeight;
		
		renderer.setPixelRatio(renderer.getSize(new THREE.Vector2()).x / renderer.getSize(new THREE.Vector2()).y);
		camera.aspect = newWidth / newHeight;
		crosshair.style.left = `${newWidth / 2 - crosshair.width / 2}px`;
		crosshair.style.top = `${newHeight / 2 - crosshair.height / 2}px`;

		renderer.setSize(newWidth, newHeight);

		camera.updateProjectionMatrix();
	};

	window.addEventListener("resize", resizeViewport); 	
	window.addEventListener("devtoolschange", resizeViewport);

	let intersectionPosition : THREE.Vector3;
	const checkForIntersections = () => {
		raycaster.setFromCamera(new THREE.Vector2(), camera);
		intersectionPosition = new THREE.Vector3();
		
		const piecesIntersections = raycaster.intersectObjects(currentPlayer == CHESSBOARD.PLAYER_1 ? whitePieces : blackPieces);

		if (piecesIntersections.length > 0) {
			if (hoveredPiece === piecesIntersections[0].object) {
				return;
			}
			
			else {
				hoveredPiece = piecesIntersections[0].object;
			}
		}

		else {
			hoveredPiece = null;
		}
	};

	window.addEventListener("keydown", (event) => {
		if (event.code == "KeyR") {
			PIECES.resetPiecesPlacements(whitePieces, blackPieces);
		}
	});

	canvas.addEventListener("mouseup", (event) => {
		if (!canvas.hasPointerCapture(0)) {
			canvas.requestPointerLock();
		}

		if (!gameOver) {
			checkForIntersections();

			if (event.button == 0) {
				// if there was an intesection with a piece
				if (hoveredPiece !== null) {
					if (hoveredPiece !== selectedPiece) {
						selectedPiece = hoveredPiece;
					}

					if (!composer.passes.includes(outlinePass)) {
						outlinePass = new OutlinePass(new THREE.Vector2(), scene, camera, [selectedPiece]);
						composer.insertPass(outlinePass, 1);
					}

					else {
						composer.removePass(outlinePass);
						outlinePass = new OutlinePass(new THREE.Vector2(), scene, camera, [selectedPiece]);
						composer.insertPass(outlinePass, 1);
					}
				}

				else if (selectedPiece) {
					raycaster.setFromCamera(new THREE.Vector2(), camera);
					const chessboardIntersections = raycaster.intersectObject(CHESSBOARD.chessboard);

					const selectedPieceWorld = selectedPiece.localToWorld(new THREE.Vector3());

					const srcIndexX = Math.trunc(selectedPieceWorld.x / CHESSBOARD.CHESSBOARD_CELL_SIZE);
					const srcIndexZ = Math.trunc(selectedPieceWorld.z / CHESSBOARD.CHESSBOARD_CELL_SIZE);

					const srcChessCoord = PIECES.convertIndexToChessCoordinates((7 - srcIndexX), srcIndexZ);

					if (chessboardIntersections.length > 0) {
						intersectionPosition = chessboardIntersections[0].point;

						const dstIndexX = Math.trunc(intersectionPosition.x / CHESSBOARD.CHESSBOARD_CELL_SIZE);
						const dstIndexZ = Math.trunc(intersectionPosition.z / CHESSBOARD.CHESSBOARD_CELL_SIZE);

						const dstChessCoord = PIECES.convertIndexToChessCoordinates((7 - dstIndexX), dstIndexZ);

						// cap intersection point to the center of the nearest cell
						intersectionPosition.x = dstIndexX * CHESSBOARD.CHESSBOARD_CELL_SIZE + CHESSBOARD.CHESSBOARD_CELL_SIZE / 2;
						intersectionPosition.z = dstIndexZ * CHESSBOARD.CHESSBOARD_CELL_SIZE + CHESSBOARD.CHESSBOARD_CELL_SIZE / 2;

						intersectionPosition.setX((intersectionPosition.x < 0 ? (-1) : (1)) * PIECES.closestCellCenter(intersectionPosition.x) + selectedPieceWorld.y);
						intersectionPosition.setY((intersectionPosition.y < 0 ? (-1) : (1)) * PIECES.closestCellCenter(intersectionPosition.y) - selectedPieceWorld.y);
						intersectionPosition.setZ((intersectionPosition.z < 0 ? (-1) : (1)) * PIECES.closestCellCenter(intersectionPosition.z) - selectedPieceWorld.y);

						let move;
						try {
							move = CHESSBOARD.chessboard_state.move({from: srcChessCoord, to: dstChessCoord});
							console.log("Move: ", move);

							// capture check
							if (move.captured !== undefined) {
								const index = PIECES.getPieceIndex(move.captured);
								const pieceName = PIECES.PIECES[index];
							
								const capturedPiece = PIECES.currentPiecesPlacement[dstIndexZ * 8 + dstIndexX]!;
								addHistory(`${turns}: ${((currentPlayer) === CHESSBOARD.PLAYER_1 ? "Black" : "White")} ${pieceName.toLowerCase()} has been captured !`);
								capturedPiece.visible = false;
								//const binPosition = capturedPiece.worldToLocal(new THREE.Vector3(-32, 0, -32));
								//capturedPiece.position.copy(binPosition);
							}

							if (CHESSBOARD.chessboard_state.inCheck()) {
								addHistory(`${turns}: ${((currentPlayer) === CHESSBOARD.PLAYER_1 ? "White" : "Black")} is in check !`);
							}

							if (CHESSBOARD.chessboard_state.isInsufficientMaterial()) {
								addHistory(`${turns}: ${((currentPlayer) === CHESSBOARD.PLAYER_1 ? "Black" : "White")} lost by insufficent material !`);
								addHistory(`${turns}: ${((currentPlayer) === CHESSBOARD.PLAYER_1 ? "White" : "Black")} won !`);
								addHistory(`${turns}: Game over !`);
								gameOver = true;
							}

							if (CHESSBOARD.chessboard_state.isStalemate()) {
								addHistory(`${turns}: ${((currentPlayer) === CHESSBOARD.PLAYER_1 ? "Black" : "White")} lost by stalemate !`);
								addHistory(`${turns}: ${((currentPlayer) === CHESSBOARD.PLAYER_1 ? "White" : "Black")} won !`);
								addHistory(`${turns}: Game over !`);
								gameOver = true;
							}

							if (CHESSBOARD.chessboard_state.isCheckmate()) {
								addHistory(`${turns}: ${((currentPlayer) === CHESSBOARD.PLAYER_1 ? "Black" : "White")} lost by checkmate !`);
								addHistory(`${turns}: ${((currentPlayer) === CHESSBOARD.PLAYER_1 ? "White" : "Black")} won !`);
								addHistory(`${turns}: Game over !`);
								gameOver = true;
							}
						}

						catch (e) {
							console.error(e);
							return;
						}

						// get selected piece index
						let selectedPieceIndex = PIECES.getPieceIndex(move.piece);

						// setting final position
						selectedPiece.position.copy(selectedPiece.parent!.worldToLocal(intersectionPosition));

						selectedPiece.updateWorldMatrix(true, true);

						// update pieces positions
						PIECES.currentPiecesPlacement[dstIndexZ * 8 + dstIndexX] = PIECES.currentPiecesPlacement[srcIndexZ * 8 + srcIndexX];
						PIECES.currentPiecesPlacement[srcIndexZ * 8 + srcIndexX] = null;

						// update state history
						addHistory(`${turns}: ${((currentPlayer) === CHESSBOARD.PLAYER_1 ? "White" : "Black")} ${PIECES.PIECES[selectedPieceIndex].toLowerCase()} : ${srcChessCoord} ⇒ ${dstChessCoord}`);

						// changing player
						currentPlayer = currentPlayer === CHESSBOARD.PLAYER_1 ? CHESSBOARD.PLAYER_2 : CHESSBOARD.PLAYER_1;
						camera.position.copy(currentPlayer === CHESSBOARD.PLAYER_1 ? new THREE.Vector3(120, CAMERA_HEIGHT, -80) : new THREE.Vector3(120, CAMERA_HEIGHT, 320));
						camera.lookAt(new THREE.Vector3(120, 0, 120));
						cameraRotation = new THREE.Euler(camera.rotation.x, camera.rotation.y, camera.rotation.z, 'YXZ');

						// unselect piece
						composer.removePass(outlinePass);
						hoveredPiece = null;
						selectedPiece = null;

						turns++;
					}
				}
			}

			else if (event.button === 1) {
				hoveredPiece = null;
				selectedPiece = null;
				composer.removePass(outlinePass);
			}
		}
	});

	canvas.addEventListener("mousemove", (mouseEvent : MouseEvent) => {
		if (document.pointerLockElement) {
			const sensibilityFactor = 0.0015;

			cameraRotation.y += mouseEvent.movementX * (-sensibilityFactor);
			cameraRotation.x += mouseEvent.movementY * (-1) ** (currentPlayer === CHESSBOARD.PLAYER_1 ? 0 : 1) * (sensibilityFactor);
			// cameraRotation.y %= 2 * Math.PI;

			/*
			if (cameraRotation.x + mouseEvent.movementY * (sensibilityFactor) >= -3 * Math.PI / 2 && cameraRotation.x + mouseEvent.movementY * (sensibilityFactor) <= -Math.PI / 2) {
				cameraRotation.x += mouseEvent.movementY * (sensibilityFactor);
				cameraRotation.x %= 2 * Math.PI;
			}
			*/
		}
	});

	let light = new THREE.PointLight(0xFFFFFF, 290000, 0);
	light.position.set(-200, 240, 80);
	light.shadow.mapSize.x = 256;
	light.shadow.mapSize.y = 256;
	light.castShadow = true;
	light.receiveShadow = true;
	light.shadow.camera.far = 2048;
	light.shadow.mapSize.x = 2048;
	light.shadow.mapSize.y = 2048;
	scene.add(light);

	let ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.40);
	scene.add(ambientLight);

	let currentPlayer = CHESSBOARD.PLAYER_1;

	const whitePieces = new Array<THREE.Group<THREE.Object3DEventMap>>(PIECES.PIECES_PER_PLAYER);
	const blackPieces = new Array<THREE.Group<THREE.Object3DEventMap>>(PIECES.PIECES_PER_PLAYER);

	let hoveredPiece : THREE.Object3D<THREE.Object3DEventMap> | null;
	let selectedPiece : THREE.Object3D<THREE.Object3DEventMap> | null;

	CHESSBOARD.loadChessboard(scene, textureLoader);
	await PIECES.loadPieces(scene, textureLoader, whitePieces, blackPieces);
	PIECES.resetPiecesPlacements(whitePieces, blackPieces);

	// Piece selection raytracer
	const raycaster = new THREE.Raycaster();

	// Multisampling
	const size = renderer.getDrawingBufferSize(new THREE.Vector2());
	const renderTarget = new THREE.WebGLRenderTarget(size.width, size.height, { samples: 4, type: THREE.FloatType });

	// Frame Processing
	const composer = new EffectComposer(renderer, renderTarget);

	const renderPass = new RenderPass(scene, camera);
	composer.addPass(renderPass);

	let outlinePass : OutlinePass;

	const outputPass = new OutputPass();
	composer.addPass(outputPass);

	// Render
	function render() : void {
		camera.setRotationFromQuaternion(new THREE.Quaternion().setFromEuler(cameraRotation, true));

		renderer.render(scene, camera);
		composer.render();

		stats.update();
		requestAnimationFrame(render);
	}

	requestAnimationFrame(render);

}

main();