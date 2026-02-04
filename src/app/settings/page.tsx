"use client"

import { useUserSettings } from '@/components/hooks/useUserSettings'
import styles from './styles.module.scss'
import { Language, LANGUAGES } from '@/components/providers/TranslationProvider';
import { useTranslation } from '@/components/hooks/useTranslation';

export default function Settings() {
    const {settings, updateSettings} = useUserSettings();
    const { t } = useTranslation("page.settings.")

    const getButtonClassName = (language: Language) => {
        const s = ["fi fi-"+language, styles["language-button"]];
        console.log(language, settings.language)
        if(language === settings.language){
            s.push(styles["selected"])
        }
        return s.join(" ")
    }

    return(
        <div className={styles['settings-container']}>
            <h3 className={styles["lists-header"]}>{t("language")}</h3>
            <div className={styles["language-container"]}>
                {LANGUAGES.map(language => (
                    <button className={getButtonClassName(language)}
                    key={language} 
                    onClick={() => {updateSettings({language})}}></button>
                ))}
            </div>
            <div className="content-divider"></div>
            <h3 className={styles["lists-header"]}>{t("theme")}</h3>
        </div>
    )
}
