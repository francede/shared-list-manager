"use client"

import { useUserSettings } from '@/components/hooks/useUserSettings'
import styles from './styles.module.scss'
import { Language, LANGUAGES } from '@/components/providers/TranslationProvider';
import { useTranslation } from '@/components/hooks/useTranslation';
import { useEffect, useState } from 'react';
import AvatarPresence from '@/components/avatarPresence';
import { useAbly } from 'ably/react';
import Toggle from '@/components/toggle';

export default function Settings() {
    const {settings, updateSettings, updateTheme} = useUserSettings();
    const [colorInputValue, setColorInputValue] = useState<string>("#FFFFFF");
    const [initialsInputValue, setInitialsInputValue] = useState<string>(""); //TODO: initals validation 2-3 chars max
    const ably = useAbly()
    const { t } = useTranslation("page.settings.")

    useEffect(() => {
        setColorInputValue(settings.avatar.color);
        setInitialsInputValue(settings.avatar.initial);
    }, [settings])

    const getButtonClassName = (language: Language) => {
        const s = ["fi fi-"+language, styles["language-button"]];
        if(language === settings.language){
            s.push(styles["selected"])
        }
        return s.join(" ")
    }

    return(
        <div>

            <div className={styles['header']}>
                <div className={styles['header-section']}>
                    <a className="material-symbols-outlined" href='/lists'>arrow_back</a>
                    <Toggle 
                        toggled={settings.theme.name==="Light"}
                        onToggle={() => {updateTheme(settings.theme.name === "Light" ? "dark" : "light")}}
                        iconOff='dark_mode'
                        iconOn='light_mode'></Toggle>
                </div> 
            </div>
            <div className={styles['settings-container']}>
                
                <h3 className={styles["lists-header"]}>{t("avatar")}</h3>
                <div className={styles['avatar-container']}>
                    <div>
                        {t("avatar-color")} <input type='color' value={colorInputValue} onChange={(e) => {setColorInputValue(e.target.value)}}></input>
                    </div>
                    <div>
                        {t("initials")} <input type="text" value={initialsInputValue} onChange={(e) => {setInitialsInputValue(e.target.value)}}></input>
                    </div>
                    <div>
                        <AvatarPresence avatars={[{avatar: {color: colorInputValue, initial: initialsInputValue}}]}></AvatarPresence>
                    </div>
                    
                    <button onClick={() => {updateSettings({avatar: {color: colorInputValue, initial: initialsInputValue}})}}>{t("save-avatar")}</button>
                </div>
                <div className="content-divider"></div>
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
        </div>
    )
}
