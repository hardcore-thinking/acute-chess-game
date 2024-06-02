import * as THREE from "three";
import { setCorrectWidth, enableShadows } from "./utils";
import { CHESSBOARD_SIZE, CHESSBOARD_CELL_SIZE } from "./chessboard";
import { loadModel } from "./model_loader";

export enum PIECES {
	ROOK = 1,
	BISHOP,
	QUEEN,
	KNIGHT,
	PAWN,
	KING,
	NONE
};

const whitePiecesCounters : { [id : string] : number } = {
	r: 0,
	b: 0,
	q: 0,
	n: 0,
	p: 0,
	k: 0
};

const blackPiecesCounters : { [id : string] : number } = {
	r: 0,
	b: 0,
	q: 0,
	n: 0,
	p: 0,
	k: 0
};

const getPieceLetter : (index: number) => string = (index: number) => {
	switch (index) {
		case PIECES.ROOK:   return "r";	
		case PIECES.BISHOP: return "b";
		case PIECES.QUEEN:  return "q";
		case PIECES.KNIGHT: return "n";
		case PIECES.PAWN:   return "p";
		case PIECES.KING:   return "k";
	}

	return ""
}

export const getPieceIndex : (letter: string) => PIECES = (letter: string) => {
	if (letter === "r") { return PIECES.ROOK; }
	else if (letter === "b") { return PIECES.BISHOP; }
	else if (letter === "q") { return PIECES.QUEEN; }
	else if (letter === "n") { return PIECES.KNIGHT; }
	else if (letter === "p") { return PIECES.PAWN; }
	else if (letter === "k") { return PIECES.KING; }

	return PIECES.NONE;
}

export const PIECES_PER_PLAYER = 16;

export const defaultPiecesPlacement : PIECES[] = [
	PIECES.ROOK,   PIECES.KNIGHT, PIECES.BISHOP, PIECES.KING,   PIECES.QUEEN,  PIECES.BISHOP, PIECES.KNIGHT, PIECES.ROOK,
    PIECES.PAWN,   PIECES.PAWN,   PIECES.PAWN,   PIECES.PAWN,   PIECES.PAWN,   PIECES.PAWN,   PIECES.PAWN,   PIECES.PAWN
];

const piecesPaths : string[] = [
    "Textures/Rook/Rook.FBX",
    "Textures/Bishop/Bishop.FBX",
    "Textures/Queen/Queen.FBX",
    "Textures/Knight/Knight.FBX",
    "Textures/Pawn/Pawn.FBX",
    "Textures/King/King.FBX",
];

const piecesMapsPaths : {black: string, white: string}[] = [
	{
		black: "Textures/Rook/Black Textures",
		white: "Textures/Rook/White Textures"
	},
	{
		black: "Textures/Bishop/Black Textures",
		white: "Textures/Bishop/White Textures"
	},
	{
		black: "Textures/Queen/Black Textures",
		white: "Textures/Queen/White Textures"
	},
	{
		black: "Textures/Knight/Black Textures",
		white: "Textures/Knight/White Textures"
	},
	{
		black: "Textures/Pawn/Black Textures",
		white: "Textures/Pawn/White Textures"
	},
	{
		black: "Textures/King/Black Textures",
		white: "Textures/King/White Textures"
	},
];

export let texturesLookup : {
	[id: string] : {
		white : {
			albedo:     THREE.Texture | null,
			normal:     THREE.Texture | null,
			smoothness: THREE.Texture | null
		}
		black : {
			albedo:     THREE.Texture | null,
			normal:     THREE.Texture | null,
			smoothness: THREE.Texture | null
		}
	}
} = {
	"r" : { white: { albedo: null, normal: null, smoothness: null }, black: { albedo: null, normal: null, smoothness: null } },
	"b" : { white: { albedo: null, normal: null, smoothness: null }, black: { albedo: null, normal: null, smoothness: null } },
	"q" : { white: { albedo: null, normal: null, smoothness: null }, black: { albedo: null, normal: null, smoothness: null } },
	"n" : { white: { albedo: null, normal: null, smoothness: null }, black: { albedo: null, normal: null, smoothness: null } },
	"p" : { white: { albedo: null, normal: null, smoothness: null }, black: { albedo: null, normal: null, smoothness: null } },
	"k" : { white: { albedo: null, normal: null, smoothness: null }, black: { albedo: null, normal: null, smoothness: null } },
}

export let modelsLookup : { [id: string]: THREE.Group<THREE.Object3DEventMap> | null } = {
	"r": null,
	"b": null,
	"q": null,
	"n": null,
	"p": null,
	"k": null
}

export let currentPiecesPlacement: (THREE.Group<THREE.Object3DEventMap> | null)[] = Array(64);

const loadTextures = async (textureLoader: THREE.TextureLoader) => {
	for (let [letter, piece] of Object.entries(texturesLookup)) {
		const index = getPieceIndex(letter);
		piece.white.albedo     = await textureLoader.loadAsync(`${piecesMapsPaths[index - 1].white}/Low_MAT_${index}_AlbedoTransparency.png`).then((texture) => texture);
		piece.white.normal     = await textureLoader.loadAsync(`${piecesMapsPaths[index - 1].white}/Low_MAT_${index}_Normal.png`).then((texture) => texture);
		piece.white.smoothness = await textureLoader.loadAsync(`${piecesMapsPaths[index - 1].white}/Low_MAT_${index}_MetallicSmoothness.png`).then((texture) => texture);

		piece.black.albedo     = await textureLoader.loadAsync(`${piecesMapsPaths[index - 1].black}/Low_MAT_${index}_AlbedoTransparency.png`).then((texture) => texture);
		piece.black.normal     = await textureLoader.loadAsync(`${piecesMapsPaths[index - 1].black}/Low_MAT_${index}_Normal.png`).then((texture) => texture);
		piece.black.smoothness = await textureLoader.loadAsync(`${piecesMapsPaths[index - 1].black}/Low_MAT_${index}_MetallicSmoothness.png`).then((texture) => texture);
	}
}

// load the models and set some properties
export const loadModels = async () => {
	for (let letter of Object.keys(modelsLookup)) {
		modelsLookup[letter] = await loadModel(piecesPaths[getPieceIndex(letter) - 1], undefined);

		if (modelsLookup[letter] !== null) {
			enableShadows(modelsLookup[letter]!);
			setCorrectWidth(modelsLookup[letter]!, (2 * CHESSBOARD_CELL_SIZE) / 3);
		}
	}
}

// set pieces arrays
export const loadPieces = async (scene: THREE.Scene, textureLoader: THREE.TextureLoader, whitePieces: THREE.Group<THREE.Object3DEventMap>[], blackPieces: THREE.Group<THREE.Object3DEventMap>[]) => {
	await loadTextures(textureLoader);
	await loadModels();

	for (let i = 0; i < PIECES_PER_PLAYER; i++) {
		const piece = defaultPiecesPlacement[i];
		const letter : string = getPieceLetter(piece);
		try {
			let model : THREE.Group<THREE.Object3DEventMap> | null = modelsLookup[getPieceLetter(piece)]!.clone();

			if (model !== null) {
				model.traverse((child) => {
					if (child instanceof THREE.Mesh) {
						child.material = new THREE.MeshStandardMaterial({
							map: texturesLookup[letter].white.albedo,
							normalMap: texturesLookup[letter].white.normal,
							roughnessMap: texturesLookup[letter].white.smoothness
						});
					}
				});

				model.name = `white_${PIECES[defaultPiecesPlacement[i]].toLowerCase()}_${whitePiecesCounters[getPieceLetter(defaultPiecesPlacement[i])]}`;
				whitePiecesCounters[getPieceLetter(defaultPiecesPlacement[i])]++;
	
				whitePieces[i] = model!;
				scene.add(model!);
			}
			
			else {
				throw new Error("model is undefined");
			}
		}
		catch (error) {
			console.log(`Something went wrong while trying to load the white ${PIECES[piece - 1]}'s model: ${error}`);
		}
	}

	for (let i = PIECES_PER_PLAYER; i < PIECES_PER_PLAYER + 64 - 2 * PIECES_PER_PLAYER; i++) {
		currentPiecesPlacement[i] = null;
	}

	for (let i = 0; i < PIECES_PER_PLAYER; i++) {
		const piece = defaultPiecesPlacement[i];
		const letter : string = getPieceLetter(piece);
		try {
			let model : THREE.Group<THREE.Object3DEventMap> | null = modelsLookup[getPieceLetter(piece)]!.clone();

			if (model !== null) {
				model.traverse((child) => {
					if (child instanceof THREE.Mesh) {
						child.material = new THREE.MeshStandardMaterial({
							map: texturesLookup[letter].black.albedo,
							normalMap: texturesLookup[letter].black.normal,
							roughnessMap: texturesLookup[letter].black.smoothness
						});
					}
				});

				model.name = `black_${PIECES[defaultPiecesPlacement[i]].toLowerCase()}_${blackPiecesCounters[getPieceLetter(defaultPiecesPlacement[i])]}`;
				blackPiecesCounters[getPieceLetter(defaultPiecesPlacement[i])]++;
	
				blackPieces[i] = model!;
				scene.add(model!);
			}
			
			else {
				throw new Error("model is undefined");
			}
		}
		catch (error) {
			console.log(`Something went wrong while trying to load the black ${PIECES[piece - 1]}'s model: ${error}`);
		}
	}
};

export const resetPiecesPlacements = (whitePieces: THREE.Group<THREE.Object3DEventMap>[], blackPieces: THREE.Group<THREE.Object3DEventMap>[]) => {
	// first player pieces	
	console.log("Resetting white pieces.");

	for (let i = 0; i < PIECES_PER_PLAYER; i++) {
		let xPos = (i * CHESSBOARD_CELL_SIZE) % CHESSBOARD_SIZE + CHESSBOARD_CELL_SIZE / 2;
		let zPos = Math.trunc(i / (PIECES_PER_PLAYER / 2)) * CHESSBOARD_CELL_SIZE + (CHESSBOARD_CELL_SIZE / 2);

		whitePieces[i].position.set(xPos, 0, zPos);

		whitePieces[i].visible = true;

		currentPiecesPlacement[i] = whitePieces[i];
	}

	// second player pieces
	console.log("Resetting black pieces.");
	
	for (let i = 0; i < PIECES_PER_PLAYER; i++) {
		let xPos = (i * CHESSBOARD_CELL_SIZE) % CHESSBOARD_SIZE + CHESSBOARD_CELL_SIZE / 2;
		let zPos = CHESSBOARD_SIZE - Math.trunc(((PIECES_PER_PLAYER - 1) - i) / (PIECES_PER_PLAYER / 2)) * CHESSBOARD_CELL_SIZE - CHESSBOARD_CELL_SIZE / 2;

		const line = Math.trunc(((PIECES_PER_PLAYER - 1) - i) / (PIECES_PER_PLAYER / 2));
		const column = i % (PIECES_PER_PLAYER / 2);
		const index = line * (PIECES_PER_PLAYER / 2) + column;

		blackPieces[index].position.set(xPos, 0, zPos);
		blackPieces[index].rotation.set(0, Math.PI, 0);

		blackPieces[index].visible = true;

		currentPiecesPlacement[6 * (PIECES_PER_PLAYER / 2) + i] = blackPieces[index];
	}
}

export const convertIndexToChessCoordinates: (indexX: number, indexY: number) => string = (indexX: number, indexZ: number) => {
	const chessX = "abcdefgh";
	const chessZ = "12345678";

	return chessX[indexX] + chessZ[indexZ];
}

export const closestCellCenter = (value: number) => {
	if (value > -0.0005 && value < 0.0005) {
		return 0;
	}

	let cappedValue = Math.trunc(Math.abs(value));
	if (cappedValue % (CHESSBOARD_CELL_SIZE / 2) === 0 && cappedValue % 2 !== 0) {
		return cappedValue;
	}

	else { 
		let result = CHESSBOARD_CELL_SIZE / 2;
        while (result < cappedValue || result % 2 === 0) {
            result += CHESSBOARD_CELL_SIZE / 2;
        }
  
		return result;
	}
}