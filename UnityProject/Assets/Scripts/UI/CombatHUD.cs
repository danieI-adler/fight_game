using UnityEngine;
using UnityEngine.UI;
using FightGame.Combat;

namespace FightGame.UI
{
    public class CombatHUD : MonoBehaviour
    {
        [Header("Lutador 1")]
        public FighterController fighter1;
        public Image p1HealthBar;
        public Image p1EnergyBar;
        public Text p1NameText;
        public Text p1ComboText;

        [Header("Lutador 2")]
        public FighterController fighter2;
        public Image p2HealthBar;
        public Image p2EnergyBar;
        public Text p2NameText;
        public Text p2ComboText;

        [Header("Timer & Mensagens")]
        public Text roundTimerText;
        public Text centerMessageText;

        private void Update()
        {
            if (fighter1 != null)
            {
                if (p1HealthBar != null && fighter1.characterData != null)
                {
                    p1HealthBar.fillAmount = fighter1.currentHealth / fighter1.characterData.maxHealth;
                }
                if (p1EnergyBar != null)
                {
                    p1EnergyBar.fillAmount = fighter1.currentEnergy / 100f;
                }
                if (p1ComboText != null)
                {
                    p1ComboText.text = fighter1.comboCounter > 1 ? $"{fighter1.comboCounter} HITS" : "";
                }
            }

            if (fighter2 != null)
            {
                if (p2HealthBar != null && fighter2.characterData != null)
                {
                    p2HealthBar.fillAmount = fighter2.currentHealth / fighter2.characterData.maxHealth;
                }
                if (p2EnergyBar != null)
                {
                    p2EnergyBar.fillAmount = fighter2.currentEnergy / 100f;
                }
                if (p2ComboText != null)
                {
                    p2ComboText.text = fighter2.comboCounter > 1 ? $"{fighter2.comboCounter} HITS" : "";
                }
            }
        }

        public void UpdateTimer(int seconds)
        {
            if (roundTimerText != null) roundTimerText.text = seconds.ToString();
        }

        public void ShowCenterMessage(string msg)
        {
            if (centerMessageText != null) centerMessageText.text = msg;
        }
    }
}
