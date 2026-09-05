using UnityEngine;
using FightGame.Combat;

namespace FightGame.UI
{
    public class CombatHUD : MonoBehaviour
    {
        [Header("Lutador 1")]
        public FighterController fighter1;

        [Header("Lutador 2")]
        public FighterController fighter2;

        [Header("Status")]
        public int currentRoundTime = 99;
        public string centerMessage = "";

        public void UpdateTimer(int seconds)
        {
            currentRoundTime = seconds;
        }

        public void ShowCenterMessage(string msg)
        {
            centerMessage = msg;
        }

        private void OnGUI()
        {
            GUI.skin.label.fontSize = 18;
            GUI.skin.label.fontStyle = FontStyle.Bold;

            // P1 HUD
            if (fighter1 != null)
            {
                GUI.color = Color.cyan;
                float p1Hp = fighter1.characterData != null ? (fighter1.currentHealth / fighter1.characterData.maxHealth) : (fighter1.currentHealth / 1000f);
                GUI.Box(new Rect(30, 30, 250 * Mathf.Clamp01(p1Hp), 25), "");
                GUI.Label(new Rect(30, 60, 250, 30), $"P1 HP: {Mathf.CeilToInt(fighter1.currentHealth)} | ENERGIA: {Mathf.CeilToInt(fighter1.currentEnergy)}%");
            }

            // P2 HUD
            if (fighter2 != null)
            {
                GUI.color = Color.red;
                float p2Hp = fighter2.characterData != null ? (fighter2.currentHealth / fighter2.characterData.maxHealth) : (fighter2.currentHealth / 1000f);
                GUI.Box(new Rect(Screen.width - 280, 30, 250 * Mathf.Clamp01(p2Hp), 25), "");
                GUI.Label(new Rect(Screen.width - 280, 60, 250, 30), $"P2 HP: {Mathf.CeilToInt(fighter2.currentHealth)} | ENERGIA: {Mathf.CeilToInt(fighter2.currentEnergy)}%");
            }

            // Centro: Timer e Mensagem
            GUI.color = Color.white;
            GUI.skin.label.alignment = TextAnchor.MiddleCenter;
            GUI.Label(new Rect(Screen.width / 2 - 50, 20, 100, 40), $"{currentRoundTime}");

            if (!string.IsNullOrEmpty(centerMessage))
            {
                GUI.skin.label.fontSize = 32;
                GUI.Label(new Rect(Screen.width / 2 - 200, Screen.height / 2 - 50, 400, 80), centerMessage);
            }
            GUI.skin.label.alignment = TextAnchor.UpperLeft;
        }
    }
}
