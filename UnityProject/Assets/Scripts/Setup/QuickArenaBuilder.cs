using UnityEngine;
using FightGame.Combat;
using FightGame.CameraSystem;
using FightGame.Managers;
using FightGame.VFX;

namespace FightGame.Setup
{
    public class QuickArenaBuilder : MonoBehaviour
    {
        private void Start()
        {
            BuildCinematicCombatEnvironment();
        }

        [ContextMenu("Construir Arena Cinematográfica Belle Époque")]
        public void BuildCinematicCombatEnvironment()
        {
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

            // 5. Criar Gustave (Player 1) com visual detalhado
            GameObject p1Obj = GameObject.Find("Player1");
            if (p1Obj == null)
            {
                p1Obj = GameObject.CreatePrimitive(PrimitiveType.Capsule);
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

                // Material Veludo Azul Belle Époque de Gustave
                Material gustaveMat = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard"));
                gustaveMat.color = new Color(0.08f, 0.22f, 0.38f);
                gustaveMat.SetFloat("_Smoothness", 0.65f);
                gustaveMat.SetFloat("_Metallic", 0.25f);
                p1Obj.GetComponent<MeshRenderer>().material = gustaveMat;

                // Braço Mecânico Dourado de Gustave (Overcharge)
                GameObject armObj = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                armObj.name = "MechanicalArm_Gold";
                armObj.transform.SetParent(p1Obj.transform);
                armObj.transform.localPosition = new Vector3(0.55f, 0.2f, 0.2f);
                armObj.transform.localScale = new Vector3(0.25f, 0.5f, 0.25f);
                armObj.transform.localRotation = Quaternion.Euler(30, 0, -20);
                DestroyImmediate(armObj.GetComponent<Collider>());

                Material goldMat = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard"));
                goldMat.color = new Color(0.95f, 0.75f, 0.25f);
                goldMat.SetFloat("_Metallic", 0.95f);
                goldMat.SetFloat("_Smoothness", 0.85f);
                armObj.GetComponent<MeshRenderer>().material = goldMat;

                // Núcleo Elétrico Ciano
                GameObject coreObj = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                coreObj.transform.SetParent(armObj.transform);
                coreObj.transform.localPosition = new Vector3(0, 0, 0.4f);
                coreObj.transform.localScale = new Vector3(0.6f, 0.3f, 0.6f);
                DestroyImmediate(coreObj.GetComponent<Collider>());
                Material coreMat = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard"));
                coreMat.color = new Color(0.2f, 0.85f, 1.0f);
                coreMat.EnableKeyword("_EMISSION");
                coreMat.SetColor("_EmissionColor", new Color(0.2f, 0.85f, 1.0f) * 2f);
                coreObj.GetComponent<MeshRenderer>().material = coreMat;

                var hurtbox1 = p1Obj.AddComponent<Hurtbox>();
                hurtbox1.owner = fighter1;

                GameObject hb1Obj = new GameObject("Hitbox_P1");
                hb1Obj.transform.SetParent(p1Obj.transform);
                var hb1 = hb1Obj.AddComponent<Hitbox>();
                hb1.owner = fighter1;
                fighter1.activeHitbox = hb1;
            }

            // 6. Criar Maelle (Player 2) com Florete de Duelo
            GameObject p2Obj = GameObject.Find("Player2");
            if (p2Obj == null)
            {
                p2Obj = GameObject.CreatePrimitive(PrimitiveType.Capsule);
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

                // Material Traje Nobre de Maelle
                Material maelleMat = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard"));
                maelleMat.color = new Color(0.55f, 0.12f, 0.15f);
                maelleMat.SetFloat("_Smoothness", 0.7f);
                maelleMat.SetFloat("_Metallic", 0.3f);
                p2Obj.GetComponent<MeshRenderer>().material = maelleMat;

                // Florete Prateado de Duelo
                GameObject rapierObj = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                rapierObj.name = "Rapier_Blade";
                rapierObj.transform.SetParent(p2Obj.transform);
                rapierObj.transform.localPosition = new Vector3(-0.6f, -0.1f, 0.4f);
                rapierObj.transform.localScale = new Vector3(0.04f, 0.8f, 0.04f);
                rapierObj.transform.localRotation = Quaternion.Euler(75, 0, 0);
                DestroyImmediate(rapierObj.GetComponent<Collider>());

                Material steelMat = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard"));
                steelMat.color = new Color(0.9f, 0.95f, 1.0f);
                steelMat.SetFloat("_Metallic", 0.95f);
                steelMat.SetFloat("_Smoothness", 0.95f);
                rapierObj.GetComponent<MeshRenderer>().material = steelMat;

                var hurtbox2 = p2Obj.AddComponent<Hurtbox>();
                hurtbox2.owner = fighter2;

                GameObject hb2Obj = new GameObject("Hitbox_P2");
                hb2Obj.transform.SetParent(p2Obj.transform);
                var hb2 = hb2Obj.AddComponent<Hitbox>();
                hb2.owner = fighter2;
                fighter2.activeHitbox = hb2;
            }

            // Conectar oponentes
            var f1 = p1Obj.GetComponent<FighterController>();
            var f2 = p2Obj.GetComponent<FighterController>();
            if (f1 != null && f2 != null)
            {
                f1.opponent = f2;
                f2.opponent = f1;
            }

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

            Debug.Log("<color=#fbbf24>✦ Arena Cinematográfica Clair Obscur montada com sucesso!</color>");
        }
    }
}
