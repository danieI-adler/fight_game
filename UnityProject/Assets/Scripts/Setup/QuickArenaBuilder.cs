using UnityEngine;
using FightGame.Combat;
using FightGame.CameraSystem;
using FightGame.Managers;
using FightGame.VFX;
using FightGame.UI;

namespace FightGame.Setup
{
    public enum ArenaStageType
    {
        LumiereDestroyedTower, // Anexo 1: Cidade submersa, Torre Eiffel partida flutuante, nuvens volumétricas e escombros
        MonolithWaterfall,     // Anexo 2: Monólito sagrado com cachoeira mística e pétalas de rosa flutuantes
        CemeteryOfSwords,      // Anexo 3: Campo desolado ao pôr do sol com centenas de espadas cravadas e eclipse lunar
        SunkenFerrisWheel      // Anexo 4: Costa rochosa de basalto, roda gigante Belle Époque caída e névoa marítima
    }

    public class QuickArenaBuilder : MonoBehaviour
    {
        [Header("Seleção de Cenário Clair Obscur")]
        public ArenaStageType stageType = ArenaStageType.LumiereDestroyedTower;

        private void Start()
        {
            BuildCinematicCombatEnvironment();
        }

        private void CleanStrayObjects()
        {
            string[] toClean = new string[] { "Player1", "Player2", "Gustave", "Gustave(Clone)", "Maelle", "Maelle(Clone)", "MechanicalArm_Gold", "Rapier_Blade", "ArenaStageRoot" };
            foreach (var name in toClean)
            {
                var objs = GameObject.FindObjectsByType<GameObject>(FindObjectsInactive.Include);
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

            // 1. Gerenciadores
            if (gameObject.GetComponent<HitstopManager>() == null) gameObject.AddComponent<HitstopManager>();
            if (gameObject.GetComponent<HitVFXManager>() == null) gameObject.AddComponent<HitVFXManager>();

            // 2. Construir Cenário Temático Selecionado
            GameObject stageRoot = new GameObject("ArenaStageRoot");
            switch (stageType)
            {
                case ArenaStageType.LumiereDestroyedTower:
                    BuildStage_LumiereTower(stageRoot);
                    break;
                case ArenaStageType.MonolithWaterfall:
                    BuildStage_MonolithWaterfall(stageRoot);
                    break;
                case ArenaStageType.CemeteryOfSwords:
                    BuildStage_CemeteryOfSwords(stageRoot);
                    break;
                case ArenaStageType.SunkenFerrisWheel:
                    BuildStage_SunkenFerrisWheel(stageRoot);
                    break;
            }

            SetupPlayersAndGameSystems();
        }

        // --- ANEXO 1: CIDADE DE LUMIÈRE E TORRE PARTIDA FLUTUANTE ---
        private void BuildStage_LumiereTower(GameObject root)
        {
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color(0.24f, 0.28f, 0.35f);
            RenderSettings.fogDensity = 0.012f;

            // 1. Chão Firme e Estável (Ponte de Pedra Belle Époque)
            GameObject floor = GameObject.CreatePrimitive(PrimitiveType.Cube);
            floor.name = "Floor_LumiereBridge";
            floor.transform.SetParent(root.transform);
            floor.transform.position = new Vector3(0, -0.5f, 0);
            floor.transform.localScale = new Vector3(36f, 1f, 8f);
            Material bridgeMat = CreatePBRMat(new Color(0.16f, 0.18f, 0.20f), 0.2f, 0.85f);
            floor.GetComponent<MeshRenderer>().material = bridgeMat;

            // 2. Modelo 3D Detalhado da Torre / Ruínas de Lumière
            GameObject modelPrefab = Resources.Load<GameObject>("Models/Stages/Stage_Lumiere");
            if (modelPrefab != null)
            {
                GameObject stageModel = Instantiate(modelPrefab, root.transform);
                stageModel.name = "Lumiere_Stage_Mesh";
                stageModel.transform.position = new Vector3(0, 0, 15f);
                stageModel.transform.localScale = Vector3.one * 1.5f;
            }

            // 3. Reflexo da Água Submersa de Paris
            GameObject water = GameObject.CreatePrimitive(PrimitiveType.Cube);
            water.name = "Water_SunkenLumiere";
            water.transform.SetParent(root.transform);
            water.transform.position = new Vector3(0, -0.7f, 6f);
            water.transform.localScale = new Vector3(90f, 0.4f, 45f);
            DestroyImmediate(water.GetComponent<Collider>());
            Material waterMat = CreatePBRMat(new Color(0.05f, 0.09f, 0.14f, 0.95f), 0.1f, 0.98f);
            water.GetComponent<MeshRenderer>().material = waterMat;

            // 4. Iluminação Chiaroscuro Dourada entre Nuvens Tempestuosas
            SetupLighting(new Color(1f, 0.92f, 0.80f), 2.4f, new Vector3(35f, -25f, 0), new Color(0.15f, 0.45f, 0.75f));
        }

        // --- ANEXO 2: MONÓLITO SAGRADO COM CACHOEIRA MÍSTICA E PÉTALAS ---
        private void BuildStage_MonolithWaterfall(GameObject root)
        {
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color(0.18f, 0.16f, 0.22f);
            RenderSettings.fogDensity = 0.010f;

            // 1. Chão Firme e Estável (Platô de Rocha Mística)
            GameObject floor = GameObject.CreatePrimitive(PrimitiveType.Cube);
            floor.name = "Floor_SacredRock";
            floor.transform.SetParent(root.transform);
            floor.transform.position = new Vector3(0, -0.5f, 0);
            floor.transform.localScale = new Vector3(36f, 1f, 8f);
            Material rockMat = CreatePBRMat(new Color(0.15f, 0.14f, 0.12f), 0.1f, 0.85f);
            floor.GetComponent<MeshRenderer>().material = rockMat;

            // 2. Modelo 3D Detalhado do Monólito Sagrado & Cachoeira
            GameObject monolithPrefab = Resources.Load<GameObject>("Models/Stages/Stage_Monolith");
            if (monolithPrefab != null)
            {
                GameObject stageModel = Instantiate(monolithPrefab, root.transform);
                stageModel.name = "Monolith_Stage_Mesh";
                stageModel.transform.position = new Vector3(0, -0.5f, 18f);
                stageModel.transform.localScale = Vector3.one * 1.8f;
            }

            // 3. Cachoeira Mística Luminosa Ciano Emissiva
            GameObject waterfall = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            waterfall.name = "Mystic_Waterfall_Glow";
            waterfall.transform.SetParent(root.transform);
            waterfall.transform.position = new Vector3(0, 10f, 17f);
            waterfall.transform.localScale = new Vector3(4.5f, 12f, 1.2f);
            DestroyImmediate(waterfall.GetComponent<Collider>());
            Material fallMat = CreatePBRMat(new Color(0.85f, 0.95f, 1f, 0.95f), 0.1f, 0.98f);
            fallMat.EnableKeyword("_EMISSION");
            fallMat.SetColor("_EmissionColor", new Color(0.3f, 0.75f, 1f) * 2.5f);
            waterfall.GetComponent<MeshRenderer>().material = fallMat;

            // 4. Luz Mística Traseira de Halo Solar
            SetupLighting(new Color(1f, 0.88f, 0.55f), 2.8f, new Vector3(15f, 180f, 0), new Color(0.85f, 0.25f, 0.35f));
        }

        // --- ANEXO 3: CEMITÉRIO DE ESPADAS E ECLIPSE LUNAR ---
        private void BuildStage_CemeteryOfSwords(GameObject root)
        {
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color(0.32f, 0.18f, 0.15f);
            RenderSettings.fogDensity = 0.015f;

            // 1. Chão Firme e Estável (Solo de Cinzas e Terra Queimada)
            GameObject floor = GameObject.CreatePrimitive(PrimitiveType.Cube);
            floor.name = "Floor_AshenWasteland";
            floor.transform.SetParent(root.transform);
            floor.transform.position = new Vector3(0, -0.5f, 0);
            floor.transform.localScale = new Vector3(36f, 1f, 8f);
            Material ashMat = CreatePBRMat(new Color(0.12f, 0.08f, 0.08f), 0.1f, 0.92f);
            floor.GetComponent<MeshRenderer>().material = ashMat;

            // 2. Modelo 3D Detalhado do Eclipse e Solo de Espadas
            GameObject eclipsePrefab = Resources.Load<GameObject>("Models/Stages/Stage_Eclipse");
            if (eclipsePrefab != null)
            {
                GameObject stageModel = Instantiate(eclipsePrefab, root.transform);
                stageModel.name = "Eclipse_Stage_Mesh";
                stageModel.transform.position = new Vector3(0, -0.5f, 16f);
                stageModel.transform.localScale = Vector3.one * 1.6f;
            }

            // 3. Eclipse Lunar Crescente Escarlate
            GameObject eclipse = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            eclipse.name = "Eclipse_Moon";
            eclipse.transform.SetParent(root.transform);
            eclipse.transform.position = new Vector3(-6f, 16f, 35f);
            eclipse.transform.localScale = new Vector3(8f, 8f, 0.5f);
            DestroyImmediate(eclipse.GetComponent<Collider>());
            Material moonMat = CreatePBRMat(new Color(1f, 0.85f, 0.7f), 0.0f, 0.1f);
            moonMat.EnableKeyword("_EMISSION");
            moonMat.SetColor("_EmissionColor", new Color(1f, 0.45f, 0.25f) * 4f);
            eclipse.GetComponent<MeshRenderer>().material = moonMat;

            // 4. Iluminação Sépia / Crepúsculo Dramático
            SetupLighting(new Color(0.95f, 0.48f, 0.32f), 2.2f, new Vector3(22f, -40f, 0), new Color(0.85f, 0.15f, 0.15f));
        }

        // --- ANEXO 4: COSTA ROCHOSA DE BASALTO E RODA GIGANTE SUBMERSA ---
        private void BuildStage_SunkenFerrisWheel(GameObject root)
        {
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color(0.18f, 0.20f, 0.22f);
            RenderSettings.fogDensity = 0.016f;

            // 1. Chão Firme e Estável (Falésia de Basalto)
            GameObject floor = GameObject.CreatePrimitive(PrimitiveType.Cube);
            floor.name = "Floor_BasaltCliff";
            floor.transform.SetParent(root.transform);
            floor.transform.position = new Vector3(0, -0.5f, 0);
            floor.transform.localScale = new Vector3(36f, 1f, 8f);
            Material basaltMat = CreatePBRMat(new Color(0.08f, 0.09f, 0.10f), 0.35f, 0.65f);
            floor.GetComponent<MeshRenderer>().material = basaltMat;

            // 2. Modelo 3D Detalhado da Roda Gigante e Colunas de Basalto
            GameObject ferrisPrefab = Resources.Load<GameObject>("Models/Stages/Stage_FerrisWheel");
            if (ferrisPrefab != null)
            {
                GameObject stageModel = Instantiate(ferrisPrefab, root.transform);
                stageModel.name = "FerrisWheel_Stage_Mesh";
                stageModel.transform.position = new Vector3(0, -0.5f, 16f);
                stageModel.transform.localScale = Vector3.one * 1.4f;
            }

            // 3. Postes de Luz Belle Époque
            for (int i = -1; i <= 1; i += 2)
            {
                GameObject lamp = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                lamp.name = $"BelleEpoque_Lamp_{i}";
                lamp.transform.SetParent(root.transform);
                lamp.transform.position = new Vector3(i * 12f, 2.2f, 3.5f);
                lamp.transform.localScale = new Vector3(0.12f, 2.2f, 0.12f);
                Material ironLampMat = CreatePBRMat(new Color(0.08f, 0.09f, 0.1f), 0.9f, 0.2f);
                lamp.GetComponent<MeshRenderer>().material = ironLampMat;

                GameObject glow = new GameObject("LampGlow");
                glow.transform.SetParent(lamp.transform);
                glow.transform.localPosition = new Vector3(0, 1.1f, 0);
                Light l = glow.AddComponent<Light>();
                l.type = LightType.Point;
                l.color = new Color(1f, 0.85f, 0.45f);
                l.range = 8f;
                l.intensity = 2.5f;
            }

            // 4. Iluminação Melancólica de Tempestade Marítima
            SetupLighting(new Color(0.75f, 0.82f, 0.92f), 1.8f, new Vector3(40f, -30f, 0), new Color(0.95f, 0.80f, 0.45f));
        }

        private Material CreatePBRMat(Color col, float metallic = 0.0f, float smoothness = 0.5f)
        {
            Material mat = new Material(Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Standard"));
            mat.color = col;
            mat.SetFloat("_Metallic", metallic);
            mat.SetFloat("_Smoothness", smoothness);
            return mat;
        }

        private void SetupLighting(Color keyColor, float keyIntensity, Vector3 keyRot, Color rimColor)
        {
            // Luz Principal Direcional (Chiaroscuro)
            GameObject keyObj = GameObject.Find("Directional Light (Chiaroscuro Key)");
            if (keyObj != null)
            {
                Light l = keyObj.GetComponent<Light>();
                l.color = keyColor;
                l.intensity = keyIntensity;
                keyObj.transform.rotation = Quaternion.Euler(keyRot);
            }

            // Luz de Recorte (Rim Light Traseira)
            GameObject rimObj = GameObject.Find("RimLight_Back");
            if (rimObj == null)
            {
                rimObj = new GameObject("RimLight_Back");
                rimObj.transform.position = new Vector3(0, 4f, 5f);
                Light rimLight = rimObj.AddComponent<Light>();
                rimLight.type = LightType.Directional;
                rimLight.transform.rotation = Quaternion.Euler(25f, 180f, 0);
            }
            Light rl = rimObj.GetComponent<Light>();
            rl.color = rimColor;
            rl.intensity = 1.6f;
        }

        private void SetupPlayersAndGameSystems()
        {
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
