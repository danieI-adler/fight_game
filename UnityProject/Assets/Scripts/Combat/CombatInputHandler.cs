using UnityEngine;

namespace FightGame.Combat
{
    public class CombatInputHandler : MonoBehaviour
    {
        public FighterController player1;
        public FighterController player2;
        public bool isVersusLocal = true;

        private void Update()
        {
            // === PLAYER 1 (GUSTAVE) - Movimento em WASD ===
            if (player1 != null)
            {
                float h1 = 0f;
                if (Input.GetKey(KeyCode.D)) h1 += 1f;
                if (Input.GetKey(KeyCode.A)) h1 -= 1f;

                bool crouch1 = Input.GetKey(KeyCode.S);
                bool jump1 = Input.GetKeyDown(KeyCode.W);
                bool lp1 = Input.GetKeyDown(KeyCode.J);
                bool hp1 = Input.GetKeyDown(KeyCode.U);
                bool lk1 = Input.GetKeyDown(KeyCode.K);
                bool hk1 = Input.GetKeyDown(KeyCode.I);
                bool sp1 = Input.GetKeyDown(KeyCode.O);
                bool sup1 = Input.GetKeyDown(KeyCode.Space);
                bool block1 = Input.GetKey(KeyCode.LeftShift);

                player1.HandleInput(h1, crouch1, jump1, lp1, hp1, lk1, hk1, sp1, sup1, block1);
            }

            // === PLAYER 2 (MAELLE) - Movimento nas SETAS (Arrow Keys) ===
            if (player2 != null && isVersusLocal)
            {
                float h2 = 0f;
                if (Input.GetKey(KeyCode.RightArrow) || Input.GetKey(KeyCode.Keypad6)) h2 += 1f;
                if (Input.GetKey(KeyCode.LeftArrow) || Input.GetKey(KeyCode.Keypad4)) h2 -= 1f;

                bool crouch2 = Input.GetKey(KeyCode.DownArrow) || Input.GetKey(KeyCode.Keypad2);
                bool jump2 = Input.GetKeyDown(KeyCode.UpArrow) || Input.GetKeyDown(KeyCode.Keypad8);
                bool lp2 = Input.GetKeyDown(KeyCode.Keypad1) || Input.GetKeyDown(KeyCode.Alpha1);
                bool hp2 = Input.GetKeyDown(KeyCode.Keypad4) || Input.GetKeyDown(KeyCode.Alpha4);
                bool lk2 = Input.GetKeyDown(KeyCode.Keypad2) || Input.GetKeyDown(KeyCode.Alpha2);
                bool hk2 = Input.GetKeyDown(KeyCode.Keypad5) || Input.GetKeyDown(KeyCode.Alpha5);
                bool sp2 = Input.GetKeyDown(KeyCode.Keypad6) || Input.GetKeyDown(KeyCode.Alpha6);
                bool sup2 = Input.GetKeyDown(KeyCode.KeypadEnter) || Input.GetKeyDown(KeyCode.Return);
                bool block2 = Input.GetKey(KeyCode.RightShift) || Input.GetKey(KeyCode.Keypad0);

                player2.HandleInput(h2, crouch2, jump2, lp2, hp2, lk2, hk2, sp2, sup2, block2);
            }
        }
    }
}
