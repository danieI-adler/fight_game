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
            if (player1 != null)
            {
                float h1 = Input.GetAxisRaw("Horizontal");
                bool crouch1 = Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow);
                bool jump1 = Input.GetKeyDown(KeyCode.W) || Input.GetKeyDown(KeyCode.UpArrow);
                bool lp1 = Input.GetKeyDown(KeyCode.J);
                bool hp1 = Input.GetKeyDown(KeyCode.U);
                bool lk1 = Input.GetKeyDown(KeyCode.K);
                bool hk1 = Input.GetKeyDown(KeyCode.I);
                bool sp1 = Input.GetKeyDown(KeyCode.O);
                bool sup1 = Input.GetKeyDown(KeyCode.Return) || Input.GetKeyDown(KeyCode.Space);

                player1.HandleInput(h1, crouch1, jump1, lp1, hp1, lk1, hk1, sp1, sup1);
            }

            if (player2 != null && isVersusLocal)
            {
                float h2 = 0f;
                if (Input.GetKey(KeyCode.Keypad6)) h2 = 1f;
                if (Input.GetKey(KeyCode.Keypad4)) h2 = -1f;

                bool crouch2 = Input.GetKey(KeyCode.Keypad2);
                bool jump2 = Input.GetKeyDown(KeyCode.Keypad8);
                bool lp2 = Input.GetKeyDown(KeyCode.Keypad1);
                bool hp2 = Input.GetKeyDown(KeyCode.Keypad4);
                bool lk2 = Input.GetKeyDown(KeyCode.Keypad2);
                bool hk2 = Input.GetKeyDown(KeyCode.Keypad5);
                bool sp2 = Input.GetKeyDown(KeyCode.Keypad6);
                bool sup2 = Input.GetKeyDown(KeyCode.KeypadEnter);

                player2.HandleInput(h2, crouch2, jump2, lp2, hp2, lk2, hk2, sp2, sup2);
            }
        }
    }
}
