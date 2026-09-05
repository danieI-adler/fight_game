using UnityEngine;
using FightGame.Combat;
using FightGame.CameraSystem;
using FightGame.Managers;

namespace FightGame.Setup
{
    public class QuickArenaBuilder : MonoBehaviour
    {
        [Header("Materiais Opcionais")]
        public Material p1Material;
        public Material p2Material;

        private void Start()
        {
            BuildCombatEnvironment();
        }

        [ContextMenu("Montar Arena e Lutadores")]
        public void BuildCombatEnvironment()
        {
            // 1. Criar Player 1
            GameObject p1Obj = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            p1Obj.name = "Player1";
            p1Obj.transform.position = new Vector3(-3.5f, 1f, 0);

            var col1 = p1Obj.GetComponent<CapsuleCollider>();
            if (col1 != null) DestroyImmediate(col1);

            var charController1 = p1Obj.AddComponent<CharacterController>();
            charController1.center = Vector3.zero;
            charController1.height = 2f;
            charController1.radius = 0.5f;

            var fighter1 = p1Obj.AddComponent<FighterController>();
            fighter1.isPlayer2 = false;

            var hurtbox1 = p1Obj.AddComponent<Hurtbox>();
            hurtbox1.owner = fighter1;

            // Hitbox P1
            GameObject hb1Obj = new GameObject("Hitbox_P1");
            hb1Obj.transform.SetParent(p1Obj.transform);
            var hb1 = hb1Obj.AddComponent<Hitbox>();
            hb1.owner = fighter1;
            fighter1.activeHitbox = hb1;

            if (p1Material != null)
                p1Obj.GetComponent<MeshRenderer>().material = p1Material;
            else
                p1Obj.GetComponent<MeshRenderer>().material.color = new Color(0.1f, 0.6f, 1.0f);

            // 2. Criar Player 2
            GameObject p2Obj = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            p2Obj.name = "Player2";
            p2Obj.transform.position = new Vector3(3.5f, 1f, 0);

            var col2 = p2Obj.GetComponent<CapsuleCollider>();
            if (col2 != null) DestroyImmediate(col2);

            var charController2 = p2Obj.AddComponent<CharacterController>();
            charController2.center = Vector3.zero;
            charController2.height = 2f;
            charController2.radius = 0.5f;

            var fighter2 = p2Obj.AddComponent<FighterController>();
            fighter2.isPlayer2 = true;

            var hurtbox2 = p2Obj.AddComponent<Hurtbox>();
            hurtbox2.owner = fighter2;

            // Hitbox P2
            GameObject hb2Obj = new GameObject("Hitbox_P2");
            hb2Obj.transform.SetParent(p2Obj.transform);
            var hb2 = hb2Obj.AddComponent<Hitbox>();
            hb2.owner = fighter2;
            fighter2.activeHitbox = hb2;

            if (p2Material != null)
                p2Obj.GetComponent<MeshRenderer>().material = p2Material;
            else
                p2Obj.GetComponent<MeshRenderer>().material.color = new Color(0.9f, 0.2f, 0.2f);

            // Conectar oponentes
            fighter1.opponent = fighter2;
            fighter2.opponent = fighter1;

            // 3. Configurar Câmera
            Camera mainCam = Camera.main;
            if (mainCam != null)
            {
                var combatCam = mainCam.GetComponent<CombatCamera>();
                if (combatCam == null) combatCam = mainCam.gameObject.AddComponent<CombatCamera>();
                combatCam.player1 = p1Obj.transform;
                combatCam.player2 = p2Obj.transform;
            }

            // 4. Configurar Input Handler & Game Manager
            var inputHandler = gameObject.GetComponent<CombatInputHandler>();
            if (inputHandler == null) inputHandler = gameObject.AddComponent<CombatInputHandler>();
            inputHandler.player1 = fighter1;
            inputHandler.player2 = fighter2;

            var gm = gameObject.GetComponent<GameManager>();
            if (gm == null) gm = gameObject.AddComponent<GameManager>();
            gm.player1 = fighter1;
            gm.player2 = fighter2;

            Debug.Log("<color=#38bdf8>✦ Arena de Luta e Lutadores instanciados com sucesso!</color>");
        }
    }
}
