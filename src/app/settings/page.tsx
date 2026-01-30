"use client"
import styles from './styles.module.scss'

export default function Settings() {
    return(
        <div className={styles['settings-container']}>
            <h3 className={styles["lists-header"]}>Language</h3>
            <div className="content-divider"></div>
            <h3 className={styles["lists-header"]}>Theme</h3>
        </div>
    )
}
