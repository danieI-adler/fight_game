using UnityEngine;
using FightGame.Combat;
using FightGame.CameraSystem;
using FightGame.Managers;
using FightGame.VFX;
using FightGame.UI;

namespace FightGame.Setup
{
    public class QuickArenaBuilder : MonoBehaviour
    {
        private void Start()
        {
            BuildCinematicCombatEnvironment();
        }

        private void CleanStrayObjects()
        {
            // Remover qualquer objeto residual ou duplicado criado na viewport
            string[] toClean = new string[] { "Player1", "Player2", "Gustave", "Gustave(Clone)", "Maelle", "Maelle(Clone)", "MechanicalArm_Gold", "Rapier_Blade" };
            foreach (var name in toClean)
            {
                var objs = GameObject.FindObjectsByType<GameObject>(FindObjectsSortMode.None);
                foreach (var obj in objs)
                {
                    if (obj != null && (obj.name == name || obj.name.StartsWith(name)))
                    {
                        DestroyImmediate(obj);
                    }
                }
            }
        }

        [ContextMenu("Construir Arena Cinematográfica Belle Époque")]
        public void BuildCinematicCombatEnvironment()
        {
            CleanStrayObjects();
            // 1. Gerenciadores de Efeitos (Hitstop e Faíscas)
            if (gameObject.GetComponent<HitstopManager>() == null) gameObject.AddComponent<HitstopManager>();
            if (gameObject.GetComponent<HitVFXManager>() == null) gameObject.AddComponent<HitVFXManager>();

            // 2. Piso de Mármore Negro Polido com Reflexo
            GameObject floor = GameObject.Find("Arena Ground (Piso de Mármore)");
            if (floor != null)
            {
                Material floorMat = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard"));
                floorMat.color = new Color(0.05f, 0.07f, 0.11f);
                floorMat.SetFloat("_Smoothness", 0.85f);
                floorMat.SetFloat("_Metallic", 0.6f);
                floor.GetComponent<MeshRenderer>().material = floorMat;
            }

            // 3. Pilares Belle Époque de Fundo
            for (int i = -4; i <= 4; i++)
            {
                if (GameObject.Find($"Pillar_{i}") == null)
                {
                    GameObject pillar = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                    pillar.name = $"Pillar_{i}";
                    pillar.transform.position = new Vector3(i * 4.5f, 4f, 4.5f);
                    pillar.transform.localScale = new Vector3(0.7f, 4.5f, 0.7f);

                    Material pillarMat = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard"));
                    pillarMat.color = new Color(0.12f, 0.15f, 0.22f);
                    pillarMat.SetFloat("_Smoothness", 0.4f);
                    pillar.GetComponent<MeshRenderer>().material = pillarMat;

                    // Luz rúnica azul/dourada em cada pilar
                    GameObject pLightObj = new GameObject($"PillarLight_{i}");
                    pLightObj.transform.SetParent(pillar.transform);
                    pLightObj.transform.localPosition = new Vector3(0, 0.5f, -0.6f);
                    Light pLight = pLightObj.AddComponent<Light>();
                    pLight.type = LightType.Point;
                    pLight.color = (i % 2 == 0) ? new Color(0.2f, 0.7f, 1.0f) : new Color(1.0f, 0.8f, 0.3f);
                    pLight.range = 7f;
                    pLight.intensity = 1.6f;
                }
            }

            // 4. Luz de Recorte Traseira (Rim Light Chiaroscuro)
            if (GameObject.Find("RimLight_Back") == null)
            {
                GameObject rimObj = new GameObject("RimLight_Back");
                rimObj.transform.position = new Vector3(0, 4f, 5f);
                Light rimLight = rimObj.AddComponent<Light>();
                rimLight.type = LightType.Directional;
                rimLight.transform.rotation = Quaternion.Euler(25f, 180f, 0);
                rimLight.color = new Color(0.8f, 0.7f, 1.0f);
                rimLight.intensity = 1.4f;
            }

            // 5. Criar Gustave (Player 1) com Modelo 3D Canônico
            GameObject p1Obj = GameObject.Find("Player1");
            if (p1Obj != null)
            {
                DestroyImmediate(p1Obj);
            }

            p1Obj = new GameObject("Player1");
            p1Obj.transform.position = new Vector3(-3.5f, 0f, 0);

            var charController1 = p1Obj.AddComponent<CharacterController>();
            charController1.center = new Vector3(0, 0.95f, 0);
            charController1.height = 1.9f;
            charController1.radius = 0.45f;

            var fighter1 = p1Obj.AddComponent<FighterController>();
            fighter1.isPlayer2 = false;
            fighter1.currentHealth = 1000f;

            // Carregar ou instanciar Modelo 3D do Gustave
            GameObject gustavePrefab = Resources.Load<GameObject>("Models/Gustave");
            GameObject visualModel = null;
            if (gustavePrefab != null)
            {
                visualModel = Instantiate(gustavePrefab, p1Obj.transform);
                visualModel.name = "Gustave_VisualModel";
                visualModel.transform.localPosition = Vector3.zero;
                visualModel.transform.localRotation = Quaternion.Euler(0, 0, 0);
            }
            else
            {
                visualModel = GameObject.CreatePrimitive(PrimitiveType.Capsule);
                visualModel.name = "Gustave_VisualModel";
                visualModel.transform.SetParent(p1Obj.transform);
                visualModel.transform.localPosition = new Vector3(0, 0.95f, 0);
                DestroyImmediate(visualModel.GetComponent<Collider>());
            }

            fighter1.modelRoot = visualModel.transform;

            var hurtbox1 = p1Obj.AddComponent<Hurtbox>();
            hurtbox1.owner = fighter1;

            GameObject hb1Obj = new GameObject("Hitbox_P1");
            hb1Obj.transform.SetParent(p1Obj.transform);
            var hb1 = hb1Obj.AddComponent<Hitbox>();
            hb1.owner = fighter1;
            fighter1.activeHitbox = hb1;

            // 6. Criar Maelle / Oponente (Player 2)
            GameObject p2Obj = GameObject.Find("Player2");
            if (p2Obj != null)
            {
                DestroyImmediate(p2Obj);
            }

            p2Obj = new GameObject("Player2");
            p2Obj.transform.position = new Vector3(3.5f, 0f, 0);

            var charController2 = p2Obj.AddComponent<CharacterController>();
            charController2.center = new Vector3(0, 0.95f, 0);
            charController2.height = 1.9f;
            charController2.radius = 0.45f;

            var fighter2 = p2Obj.AddComponent<FighterController>();
            fighter2.isPlayer2 = true;
            fighter2.currentHealth = 1000f;

            // Carregar ou instanciar Modelo 3D de Maelle
            GameObject maellePrefab = Resources.Load<GameObject>("Models/Maelle");
            GameObject visualModel2 = null;
            if (maellePrefab != null)
            {
                visualModel2 = Instantiate(maellePrefab, p2Obj.transform);
                visualModel2.name = "Maelle_VisualModel";
                visualModel2.transform.localPosition = Vector3.zero;
                visualModel2.transform.localRotation = Quaternion.Euler(0, 0, 0);
            }
            else
            {
                visualModel2 = GameObject.CreatePrimitive(PrimitiveType.Capsule);
                visualModel2.name = "Maelle_VisualModel";
                visualModel2.transform.SetParent(p2Obj.transform);
                visualModel2.transform.localPosition = new Vector3(0, 0.95f, 0);
                DestroyImmediate(visualModel2.GetComponent<Collider>());

                Material maelleMat = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard"));
                maelleMat.color = new Color(0.65f, 0.12f, 0.18f);
                visualModel2.GetComponent<MeshRenderer>().material = maelleMat;
            }

            fighter2.modelRoot = visualModel2.transform;

            var hurtbox2 = p2Obj.AddComponent<Hurtbox>();
            hurtbox2.owner = fighter2;

            GameObject hb2Obj = new GameObject("Hitbox_P2");
            hb2Obj.transform.SetParent(p2Obj.transform);
            var hb2 = hb2Obj.AddComponent<Hitbox>();
            hb2.owner = fighter2;
            fighter2.activeHitbox = hb2;

            // Conectar oponentes
            var f1 = p1Obj.GetComponent<FighterController>();
            var f2 = p2Obj.GetComponent<FighterController>();
            if (f1 != null && f2 != null)
            {
                f1.opponent = f2;
                f2.opponent = f1;
            }

            // Configurar HUD
            var hud = gameObject.GetComponent<CombatHUD>();
            if (hud == null) hud = gameObject.AddComponent<CombatHUD>();
            hud.fighter1 = f1;
            hud.fighter2 = f2;

            // Configurar Câmera
            Camera mainCam = Camera.main;
            if (mainCam != null)
            {
                var combatCam = mainCam.GetComponent<CombatCamera>();
                if (combatCam == null) combatCam = mainCam.gameObject.AddComponent<CombatCamera>();
                combatCam.player1 = p1Obj.transform;
                combatCam.player2 = p2Obj.transform;
            }

            // Configurar Input & Game Manager
            var inputHandler = gameObject.GetComponent<CombatInputHandler>();
            if (inputHandler == null) inputHandler = gameObject.AddComponent<CombatInputHandler>();
            inputHandler.player1 = f1;
            inputHandler.player2 = f2;

            var gm = gameObject.GetComponent<GameManager>();
            if (gm == null) gm = gameObject.AddComponent<GameManager>();
            gm.player1 = f1;
            gm.player2 = f2;
            gm.hud = hud;

            Debug.Log("<color=#fbbf24>✦ Arena Cinematográfica Clair Obscur montada com Gustave AAA e HUD ativo!</color>");
        }
    }
}
