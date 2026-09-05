using System.Collections;
using UnityEngine;
using FightGame.Combat;
using FightGame.UI;
using FightGame.CameraSystem;

namespace FightGame.Managers
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance;

        [Header("Lutadores")]
        public FighterController player1;
        public FighterController player2;

        [Header("Sistemas")]
        public CombatHUD hud;
        public CombatCamera combatCamera;

        [Header("Configurações do Round")]
        public float roundDuration = 99f;
        private float currentRoundTime;
        public int currentRound = 1;
        public int p1Wins = 0;
        public int p2Wins = 0;
        public bool isFightActive = false;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void Start()
        {
            StartCoroutine(MatchFlowCoroutine());
        }

        private IEnumerator MatchFlowCoroutine()
        {
            isFightActive = false;
            currentRoundTime = roundDuration;

            if (hud != null)
            {
                hud.ShowCenterMessage($"ROUND {currentRound}");
            }

            yield return new WaitForSeconds(1.5f);

            if (hud != null)
            {
                hud.ShowCenterMessage("FIGHT!");
            }

            yield return new WaitForSeconds(0.8f);

            if (hud != null)
            {
                hud.ShowCenterMessage("");
            }

            isFightActive = true;

            while (isFightActive)
            {
                currentRoundTime -= Time.deltaTime;
                if (hud != null)
                {
                    hud.UpdateTimer(Mathf.CeilToInt(currentRoundTime));
                }

                if (player1.currentHealth <= 0 || player2.currentHealth <= 0 || currentRoundTime <= 0)
                {
                    isFightActive = false;
                    HandleRoundEnd();
                }

                yield return null;
            }
        }

        private void HandleRoundEnd()
        {
            if (player1.currentHealth <= 0 && player2.currentHealth <= 0)
            {
                if (hud != null) hud.ShowCenterMessage("DOUBLE K.O.!");
            }
            else if (player1.currentHealth <= 0)
            {
                p2Wins++;
                if (hud != null) hud.ShowCenterMessage("K.O. - P2 VENCE!");
            }
            else if (player2.currentHealth <= 0)
            {
                p1Wins++;
                if (hud != null) hud.ShowCenterMessage("K.O. - P1 VENCE!");
            }
            else
            {
                if (hud != null) hud.ShowCenterMessage("TEMPO!");
            }

            if (combatCamera != null)
            {
                combatCamera.AddShake(0.4f, 0.5f);
            }
        }
    }
}
