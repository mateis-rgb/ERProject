// Chiffrement at-rest des drives de projets chiffrés (AES-256-GCM contenu, HMAC noms) - Power of 10
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { config } from "../config";
import { assert } from "../utils/power10";

const IV_LEN = 12;
const TAG_LEN = 16;
const KEY_LEN = 32;
const MASTER_KEY_FILE = path.resolve(__dirname, "..", "..", ".master-key"); // backend/.master-key

let cachedMasterKey: Buffer | null = null;

// Master key : env STORAGE_MASTER_KEY (64 hex) prioritaire, sinon fichier backend/.master-key généré en 0600
function loadMasterKey(): Buffer {
    if (cachedMasterKey !== null) return cachedMasterKey;
    const envKey = config.storageMasterKey;
    if (envKey !== null && envKey !== "") {
        const buf = Buffer.from(envKey, "hex");
        assert(buf.length === KEY_LEN, "STORAGE_MASTER_KEY doit faire 64 caractères hex (32 octets)");
        cachedMasterKey = buf;
        return buf;
    }
    // shortcut: master key auto-générée dans backend/.master-key si pas d'env — perdre ce fichier rend les drives chiffrés illisibles
    if (fs.existsSync(MASTER_KEY_FILE)) {
        const buf = Buffer.from(fs.readFileSync(MASTER_KEY_FILE, "utf8").trim(), "hex");
        assert(buf.length === KEY_LEN, ".master-key invalide (64 caractères hex attendus)");
        cachedMasterKey = buf;
        return buf;
    }
    const generated = crypto.randomBytes(KEY_LEN);
    fs.writeFileSync(MASTER_KEY_FILE, generated.toString("hex") + "\n", { mode: 0o600 });
    console.warn("[CRYPTO] STORAGE_MASTER_KEY non défini : master key générée dans backend/.master-key (protéger ce fichier)");
    cachedMasterKey = generated;
    return generated;
}

export function getMasterKey(): Buffer {
    return loadMasterKey();
}

// Data key aléatoire par projet chiffré
export function generateDataKey(): Buffer {
    return crypto.randomBytes(KEY_LEN);
}

// Chiffre une data key avec la master key (stockage en BDD) : hex(iv + tag + ct)
export function encryptDataKey(dataKey: Buffer): string {
    assert(dataKey.length === KEY_LEN, "encryptDataKey: clé invalide");
    const iv = crypto.randomBytes(IV_LEN);
    const c = crypto.createCipheriv("aes-256-gcm", getMasterKey(), iv);
    const ct = Buffer.concat([c.update(dataKey), c.final()]);
    return Buffer.concat([iv, c.getAuthTag(), ct]).toString("hex");
}

export function decryptDataKey(hex: string): Buffer {
    const raw = Buffer.from(hex, "hex");
    assert(raw.length > IV_LEN + TAG_LEN, "decryptDataKey: données invalides");
    const iv = raw.subarray(0, IV_LEN);
    const tag = raw.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const ct = raw.subarray(IV_LEN + TAG_LEN);
    const d = crypto.createDecipheriv("aes-256-gcm", getMasterKey(), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(ct), d.final()]);
}

// Chiffrement réversible d'un contenu (fichier) : Buffer(iv + tag + ct)
export function encryptBuffer(dataKey: Buffer, data: Buffer): Buffer {
    assert(dataKey.length === KEY_LEN, "encryptBuffer: clé invalide");
    const iv = crypto.randomBytes(IV_LEN);
    const c = crypto.createCipheriv("aes-256-gcm", dataKey, iv);
    const ct = Buffer.concat([c.update(data), c.final()]);
    return Buffer.concat([iv, c.getAuthTag(), ct]);
}

export function decryptBuffer(dataKey: Buffer, raw: Buffer): Buffer {
    assert(dataKey.length === KEY_LEN, "decryptBuffer: clé invalide");
    assert(raw.length > IV_LEN + TAG_LEN, "decryptBuffer: données invalides");
    const iv = raw.subarray(0, IV_LEN);
    const tag = raw.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const ct = raw.subarray(IV_LEN + TAG_LEN);
    const d = crypto.createDecipheriv("aes-256-gcm", dataKey, iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(ct), d.final()]);
}

// Empreinte déterministe d'un nom (segment de chemin disque) : 48 hex, non réversible, stable pour un même nom
export function nameHash(dataKey: Buffer, name: string): string {
    return crypto.createHmac("sha256", dataKey).update(`name:${name}`).digest("hex").slice(0, 48);
}
