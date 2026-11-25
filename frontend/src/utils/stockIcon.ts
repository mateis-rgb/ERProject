// Icône automatique d'un article stock : 1er mot-clé de la référence (ex. "CAB-HDMI-03" -> "CAB")
// -> icône isométrique (pack bs) ; fallback sur catégorie/nom, puis cube par défaut (Power of 10 R4)
import { IconType } from "react-icons";
import {
    BsAlarm, BsArchive, BsBagHeart, BsBasket, BsBatteryCharging, BsBicycle, BsBox2, BsBoxSeam, BsBriefcase,
    BsBrush, BsCamera, BsCameraVideo, BsCarFront, BsClock, BsDisplay, BsDroplet, BsEasel,
    BsFan, BsFileText, BsFilm, BsFlag, BsFolder, BsFuelPump, BsGear, BsGridFill, BsHdd, BsHeadphones,
    BsImage, BsJournalText, BsKeyboard, BsLadder, BsLaptop, BsLightbulbFill, BsLightningCharge, BsMicFill,
    BsMouse, BsPalette, BsPaperclip, BsPencil, BsPhone, BsPlugFill, BsPower, BsPrinter, BsRecordCircle,
    BsRepeat, BsRulers, BsSdCard, BsShieldCheck, BsSignpost, BsSpeakerFill, BsStars, BsStopwatch, BsTools,
    BsThermometer, BsThermometerHigh, BsTruck, BsUmbrella, BsUsbDrive, BsWifi, BsWrenchAdjustable, BsHammer, BsScrewdriver,
} from "react-icons/bs";

export const DEFAULT_STOCK_ICON = BsBoxSeam;

// Préfixes de référence (1er token, en majuscules) -> icône
const PREFIX_ICONS: [string, IconType][] = [
    ["CAM", BsCameraVideo], ["CAMERA", BsCameraVideo], ["VIDEO", BsCameraVideo], ["VID", BsCameraVideo],
    ["OBJ", BsCamera], ["OBJECTIF", BsCamera], ["LENS", BsCamera], ["ZOOM", BsCamera],
    ["TRI", BsSignpost], ["TRIPOD", BsSignpost], ["PIED", BsSignpost], ["STAND", BsSignpost], ["SUPPORT", BsSignpost],
    ["MIC", BsMicFill], ["MICRO", BsMicFill], ["HF", BsMicFill], ["LAVALIERE", BsMicFill],
    ["CASQUE", BsHeadphones], ["HEADPHONE", BsHeadphones], ["HEADSET", BsHeadphones],
    ["ENCEINTE", BsSpeakerFill], ["SPEAKER", BsSpeakerFill], ["SONO", BsSpeakerFill], ["BOOM", BsSpeakerFill],
    ["LUM", BsLightbulbFill], ["LUMIERE", BsLightbulbFill], ["PROJ", BsLightbulbFill], ["PROJECTEUR", BsLightbulbFill],
    ["LIGHT", BsLightbulbFill], ["LED", BsLightbulbFill], ["PANNEAU", BsLightbulbFill],
    ["CAB", BsPlugFill], ["CABLE", BsPlugFill], ["XLR", BsPlugFill], ["HDMI", BsPlugFill], ["SDI", BsPlugFill],
    ["BNC", BsPlugFill], ["JACK", BsPlugFill], ["RCA", BsPlugFill], ["FIBRE", BsPlugFill], ["AUX", BsPlugFill],
    ["BAT", BsBatteryCharging], ["BATTERIE", BsBatteryCharging], ["ACCU", BsBatteryCharging], ["VMOUNT", BsBatteryCharging],
    ["CHG", BsLightningCharge], ["CHARGEUR", BsLightningCharge], ["ALIM", BsLightningCharge],
    ["STAB", BsGear], ["GIMBAL", BsGear], ["STEADICAM", BsGear],
    ["MON", BsDisplay], ["MONITOR", BsDisplay], ["ECRAN", BsDisplay], ["SCREEN", BsDisplay], ["TV", BsDisplay], ["RETOUR", BsDisplay],
    ["REC", BsRecordCircle], ["ENREG", BsRecordCircle], ["MAGNETO", BsRecordCircle], ["NAGRA", BsRecordCircle],
    ["SD", BsSdCard], ["CARTE", BsSdCard], ["CF", BsSdCard], ["XQD", BsSdCard],
    ["HDD", BsHdd], ["SSD", BsHdd], ["DISQUE", BsHdd], ["DISK", BsHdd],
    ["USB", BsUsbDrive], ["CLEUSB", BsUsbDrive],
    ["ADAPT", BsRepeat], ["ADAP", BsRepeat], ["CONVERT", BsRepeat], ["TRANSFO", BsRepeat],
    ["HOUSSE", BsBriefcase], ["CASE", BsBriefcase], ["MALLE", BsBriefcase], ["FLIGHT", BsBriefcase], ["VALISE", BsBriefcase],
    ["KIT", BsBox2], ["TROUSSE", BsBox2], ["TOOLBOX", BsBox2], ["COFFRET", BsBox2],
    ["MESURE", BsRulers], ["METRE", BsRulers], ["LASER", BsRulers], ["DECAMETRE", BsRulers],
    ["TOOL", BsTools], ["OUTIL", BsTools], ["CLE", BsWrenchAdjustable], ["WRENCH", BsWrenchAdjustable],
    ["MARTEAU", BsHammer], ["HAMMER", BsHammer], ["TOURNEVIS", BsScrewdriver], ["SCREW", BsScrewdriver],
    ["SCRIPT", BsJournalText], ["SCENARIO", BsJournalText], ["STORYBOARD", BsEasel], ["SB", BsEasel],
    ["CLAP", BsFilm], ["CLAQUETTE", BsFilm], ["SLATE", BsFilm],
    ["FOND", BsImage], ["CHROMA", BsImage], ["TELON", BsImage], ["TOILE", BsImage], ["BACKDROP", BsImage],
    ["DECOR", BsPalette], ["ACCESSOIRE", BsPalette],
    ["MOBILIER", BsGridFill], ["CHAISE", BsGridFill], ["TABLE", BsGridFill], ["BANC", BsGridFill],
    ["SONDE", BsThermometer], ["CAPTEUR", BsThermometer], ["SENSOR", BsThermometer],
    ["VENTILO", BsFan], ["FAN", BsFan],
    ["CHAUFFAGE", BsThermometerHigh], ["RADIATEUR", BsThermometerHigh], ["HEATER", BsThermometerHigh],
    ["GEN", BsPower], ["GROUPE", BsPower], ["GENERATRICE", BsPower],
    ["ESSENCE", BsFuelPump], ["CARBURANT", BsFuelPump], ["FUEL", BsFuelPump], ["BIDON", BsFuelPump],
    ["CAMION", BsTruck], ["VAN", BsTruck], ["TRUCK", BsTruck], ["VEHICULE", BsTruck],
    ["CAR", BsCarFront], ["VOITURE", BsCarFront],
    ["VELO", BsBicycle], ["BIKE", BsBicycle], ["TROTTINETTE", BsBicycle],
    ["ECHELLE", BsLadder], ["LADDER", BsLadder], ["ESCABEAU", BsLadder], ["ECHAFAUDAGE", BsLadder], ["SCAFFOLD", BsLadder],
    ["EXTINCTEUR", BsShieldCheck], ["SECU", BsShieldCheck], ["SECURITE", BsShieldCheck], ["FIRE", BsShieldCheck],
    ["SOIN", BsBagHeart], ["PHARMACIE", BsBagHeart], ["FIRSTAID", BsBagHeart],
    ["NETTOYAGE", BsStars], ["LINGETTE", BsStars], ["CLEAN", BsStars], ["SPRAY", BsDroplet],
    ["SCOTCH", BsPaperclip], ["GAFFER", BsPaperclip], ["TAPE", BsPaperclip], ["ADHESIF", BsPaperclip], ["RUBAN", BsPaperclip],
    ["PEINTURE", BsBrush], ["POT", BsBrush], ["PINCEAU", BsBrush], ["ROULEAU", BsBrush],
    ["CRAYON", BsPencil], ["STYLO", BsPencil], ["MARQUEUR", BsPencil], ["PENCIL", BsPencil],
    ["CLAVIER", BsKeyboard], ["KEYBOARD", BsKeyboard],
    ["SOURIS", BsMouse], ["MOUSE", BsMouse],
    ["IMPRIMANTE", BsPrinter], ["PRINTER", BsPrinter],
    ["TEL", BsPhone], ["PHONE", BsPhone], ["SMARTPHONE", BsPhone],
    ["TABLETTE", BsFolder], ["PC", BsLaptop], ["LAPTOP", BsLaptop], ["ORDINATEUR", BsLaptop],
    ["ROUTER", BsWifi], ["BOX", BsWifi], ["WIFI", BsWifi],
    ["RACK", BsArchive], ["ARMOIRE", BsArchive], ["BAIE", BsArchive], ["STOCKAGE", BsArchive],
    ["DOSSIER", BsFolder], ["CLASSEUR", BsFolder],
    ["CONE", BsFlag], ["BALISAGE", BsFlag], ["POTEAU", BsFlag], ["BARRIERE", BsFlag],
    ["HORLOGE", BsClock], ["CLOCK", BsClock], ["MONTRE", BsStopwatch], ["TIMER", BsStopwatch], ["STOPWATCH", BsStopwatch],
    ["ALARME", BsAlarm], ["SIRENE", BsAlarm], ["BELL", BsAlarm],
    ["ETIQUETTE", BsFileText], ["TAG", BsFileText], ["LABEL", BsFileText],
    ["PARAPLUIE", BsUmbrella], ["PARASOL", BsUmbrella], ["UMBRELLA", BsUmbrella],
    ["BACHE", BsImage], ["TARP", BsImage],
];

// Fallback : mots-clés dans catégorie + nom
const TEXT_RULES: [string[], IconType][] = [
    [["caméra", "camera", "video"], BsCameraVideo],
    [["objectif", "lens"], BsCamera],
    [["éclairage", "eclairage", "lumière", "lumiere", "projecteur", "led"], BsLightbulbFill],
    [["son", "micro", "audio", "enceinte"], BsMicFill],
    [["casque"], BsHeadphones],
    [["câble", "cable", "adaptateur"], BsPlugFill],
    [["batterie", "accu", "chargeur", "pile"], BsBatteryCharging],
    [["écran", "moniteur", "télé", "tv"], BsDisplay],
    [["disque", "carte", "clé usb", "ssd", "hdd"], BsSdCard],
    [["trépied", "pied", "stand", "support"], BsSignpost],
    [["malle", "valise", "housse", "flight"], BsBriefcase],
    [["outil", "tournevis", "clé", "marteau"], BsTools],
    [["scénario", "script", "storyboard"], BsJournalText],
    [["décor", "fond", "accessoire"], BsPalette],
    [["mobilier", "chaise", "table"], BsGridFill],
    [["véhicule", "camion", "van", "voiture"], BsTruck],
    [["échelle", "escabeau", "échafaudage"], BsLadder],
    [["sécurité", "extincteur", "soin"], BsShieldCheck],
    [["nettoyage", "lingette", "scotch", "adhésif"], BsStars],
    [["peinture", "pinceau", "crayon", "marqueur"], BsBrush],
    [["armoire", "rack", "stockage", "dossier"], BsArchive],
    [["consommable", "divers", "autre"], BsBasket],
];

// 1er token de la référence : "CAB-HDMI-03" -> "CAB", "CAM S52X" -> "CAM"
export function firstRefToken(ref: string): string {
    const parts = ref.toUpperCase().split(/[^A-Z0-9]+/).filter((p) => p !== "");
    return parts[0] ?? "";
}

function iconForToken(token: string): IconType | null {
    if (token === "") return null;
    const exact = PREFIX_ICONS.find(([k]) => k === token);
    if (exact !== undefined) return exact[1];
    const byPrefix = PREFIX_ICONS
        .filter(([k]) => token.startsWith(k) || k.startsWith(token))
        .sort((a, b) => b[0].length - a[0].length)[0];
    return byPrefix !== undefined ? byPrefix[1] : null;
}

export function stockIconFor(category: string, name: string, reference: string = ""): IconType {
    const fromRef = iconForToken(firstRefToken(reference));
    if (fromRef !== null) return fromRef;
    const text = `${category} ${name}`.toLowerCase();
    for (const [keywords, icon] of TEXT_RULES) {
        for (const kw of keywords) {
            if (text.includes(kw)) return icon;
        }
    }
    return DEFAULT_STOCK_ICON;
}
