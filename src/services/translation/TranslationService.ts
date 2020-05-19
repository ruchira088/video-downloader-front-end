import configuration from "services/Configuration"
import {phraseMappings} from "services/sanitize/SanitizationService"

const translate = (phrase: string): string => configuration.safeMode ? phraseMappings(phrase) : phrase

export default translate
