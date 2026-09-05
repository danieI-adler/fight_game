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

        private GUIStyle timerStyle;
        private GUIStyle nameStyle;
        private GUIStyle comboStyle;
        private GUIStyle centerMsgStyle;
        private Texture2D p1HpTex;
        private Texture2D p2HpTex;
        private Texture2D bgHpTex;
        private Texture2D superTex;

        private void Awake()
        {
            p1HpTex = MakeTex(2, 2, new Color(0.12f, 0.72f, 0.98f)); // Ciano Gustave
            p2HpTex = MakeTex(2, 2, new Color(0.95f, 0.22f, 0.28f)); // Carmim Maelle
            bgHpTex = MakeTex(2, 2, new Color(0.08f, 0.08f, 0.12f, 0.85f));
            superTex = MakeTex(2, 2, new Color(0.95f, 0.80f, 0.20f)); // Ouro Super
        }

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

        private void OnGUI()
        {
            InitStyles();

            float screenW = Screen.width;
            float barWidth = Mathf.Min(380f, screenW * 0.38f);
            float barHeight = 24f;
            float topMargin = 25f;

            // --- TIMER CENTRAL ---
            float timerWidth = 80f;
            Rect timerRect = new Rect((screenW - timerWidth) * 0.5f, topMargin - 8f, timerWidth, 45f);
            GUI.Label(timerRect, currentRoundTime.ToString("D2"), timerStyle);

            // --- P1 (GUSTAVE) HP & SUPER BAR ---
            if (fighter1 != null)
            {
                float p1MaxHp = fighter1.characterData != null ? fighter1.characterData.maxHealth : 1000f;
                float p1HpPct = Mathf.Clamp01(fighter1.currentHealth / p1MaxHp);

                Rect p1BgRect = new Rect(timerRect.x - barWidth - 15f, topMargin, barWidth, barHeight);
                GUI.DrawTexture(p1BgRect, bgHpTex);

                Rect p1FillRect = new Rect(p1BgRect.x + barWidth * (1f - p1HpPct), topMargin, barWidth * p1HpPct, barHeight);
                GUI.DrawTexture(p1FillRect, p1HpTex);

                GUI.Label(new Rect(p1BgRect.x, topMargin - 20f, 200f, 20f), "GUSTAVE (P1)", nameStyle);

                // Super Meter P1
                float p1SuperPct = Mathf.Clamp01(fighter1.currentEnergy / 100f);
                Rect p1SuperBg = new Rect(p1BgRect.x, topMargin + barHeight + 4f, barWidth * 0.7f, 10f);
                GUI.DrawTexture(p1SuperBg, bgHpTex);
                GUI.DrawTexture(new Rect(p1SuperBg.x, p1SuperBg.y, p1SuperBg.width * p1SuperPct, 10f), superTex);

                // Combo Counter P1
                if (fighter1.comboCounter > 1)
                {
                    GUI.Label(new Rect(p1BgRect.x, topMargin + barHeight + 25f, 200f, 30f), $"{fighter1.comboCounter} HITS!", comboStyle);
                }
            }

            // --- P2 (MAELLE) HP & SUPER BAR ---
            if (fighter2 != null)
            {
                float p2MaxHp = fighter2.characterData != null ? fighter2.characterData.maxHealth : 1000f;
                float p2HpPct = Mathf.Clamp01(fighter2.currentHealth / p2MaxHp);

                Rect p2BgRect = new Rect(timerRect.xMax + 15f, topMargin, barWidth, barHeight);
                GUI.DrawTexture(p2BgRect, bgHpTex);

                Rect p2FillRect = new Rect(p2BgRect.x, topMargin, barWidth * p2HpPct, barHeight);
                GUI.DrawTexture(p2FillRect, p2HpTex);

                GUI.Label(new Rect(p2BgRect.xMax - 200f, topMargin - 20f, 200f, 20f), "MAELLE (P2)", nameStyle);

                // Super Meter P2
                float p2SuperPct = Mathf.Clamp01(fighter2.currentEnergy / 100f);
                Rect p2SuperBg = new Rect(p2BgRect.xMax - (barWidth * 0.7f), topMargin + barHeight + 4f, barWidth * 0.7f, 10f);
                GUI.DrawTexture(p2SuperBg, bgHpTex);
                GUI.DrawTexture(new Rect(p2SuperBg.xMax - (p2SuperBg.width * p2SuperPct), p2SuperBg.y, p2SuperBg.width * p2SuperPct, 10f), superTex);

                // Combo Counter P2
                if (fighter2.comboCounter > 1)
                {
                    GUI.Label(new Rect(p2BgRect.x, topMargin + barHeight + 25f, 200f, 30f), $"{fighter2.comboCounter} HITS!", comboStyle);
                }
            }

            // --- MENSAGEM DE CENTRO (ROUND 1, FIGHT, K.O.) ---
            if (!string.IsNullOrEmpty(centerMessage))
            {
                Rect msgRect = new Rect((screenW - 500f) * 0.5f, Screen.height * 0.35f, 500f, 80f);
                GUI.Label(msgRect, centerMessage, centerMsgStyle);
            }
        }

        private void InitStyles()
        {
            if (timerStyle == null)
            {
                timerStyle = new GUIStyle(GUI.skin.label)
                {
                    fontSize = 32,
                    fontStyle = FontStyle.Bold,
                    alignment = TextAnchor.MiddleCenter
                };
                timerStyle.normal.textColor = new Color(0.96f, 0.84f, 0.35f);

                nameStyle = new GUIStyle(GUI.skin.label)
                {
                    fontSize = 14,
                    fontStyle = FontStyle.Bold
                };
                nameStyle.normal.textColor = Color.white;

                comboStyle = new GUIStyle(GUI.skin.label)
                {
                    fontSize = 22,
                    fontStyle = FontStyle.Bold
                };
                comboStyle.normal.textColor = new Color(1f, 0.5f, 0.1f);

                centerMsgStyle = new GUIStyle(GUI.skin.label)
                {
                    fontSize = 54,
                    fontStyle = FontStyle.Bold,
                    alignment = TextAnchor.MiddleCenter
                };
                centerMsgStyle.normal.textColor = new Color(1f, 0.85f, 0.25f);
            }
        }

        private Texture2D MakeTex(int width, int height, Color col)
        {
            Color[] pix = new Color[width * height];
            for (int i = 0; i < pix.Length; i++) pix[i] = col;
            Texture2D result = new Texture2D(width, height);
            result.SetPixels(pix);
            result.Apply();
            return result;
        }
    }
}
