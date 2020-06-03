import {phraseMappings} from "services/sanitize/SanitizationService"

export default (phrase: string, safeMode: boolean): string => safeMode ? phraseMappings(phrase) : phrase
