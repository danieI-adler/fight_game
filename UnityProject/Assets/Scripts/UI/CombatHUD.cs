using UnityEngine;
using FightGame.Combat;

namespace FightGame.UI
{
    public class CombatHUD : MonoBehaviour
    {
        [Header("Lutadores")]
        public FighterController fighter1;
        public FighterController fighter2;

        [Header("Status da Luta")]
        public int currentRoundTime = 99;
        public string centerMessage = "";

        public void UpdateTimer(int seconds)
        {
            currentRoundTime = seconds;
        }

        public void ShowCenterMessage(string msg)
        {
            centerMessage = msg;
            if (!string.IsNullOrEmpty(msg))
            {
                Debug.Log($"<color=#fbbf24><b>[COMBATE] {msg}</b></color>");
            }
        }
    }
}
