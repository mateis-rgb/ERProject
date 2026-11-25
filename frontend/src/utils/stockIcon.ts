// Icône automatique d'un article stock selon sa catégorie (style isométrique, pack bs) (Power of 10 R4)
import { IconType } from "react-icons";
import {
    BsBoxSeam, BsCameraVideo, BsLightbulb, BsMic, BsTools, BsBasket, BsPlug, BsBatteryCharging, BsFilm, BsSpeaker,
} from "react-icons/bs";

// [mots-clés catégorie/nom, icône] — le premier match gagne, défaut = cube isométrique
const RULES: [string[], IconType][] = [
    [["caméra", "camera", "video", "film"], BsCameraVideo],
    [["éclairage", "eclairage", "lumière", "lumiere", "light", "projecteur"], BsLightbulb],
    [["son", "micro", "audio", "enceinte"], BsMic],
    [["casque", "headphone"], BsSpeaker],
    [["accessoire", "outil", "tool", "câble", "cable"], BsTools],
    [["consommable", "batterie", "pile"], BsBatteryCharging],
    [["plug", "alim", "chargeur"], BsPlug],
    [["basket", "panier", "consommable"], BsBasket],
    [["pellicule", "cassette", "disque", "stockage"], BsFilm],
];

export function stockIconFor(category: string, name: string): IconType {
    const text = `${category} ${name}`.toLowerCase();
    for (const [keywords, icon] of RULES) {
        for (const kw of keywords) {
            if (text.includes(kw)) return icon;
        }
    }
    return BsBoxSeam;
}
