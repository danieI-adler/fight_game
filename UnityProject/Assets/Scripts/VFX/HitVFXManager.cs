using UnityEngine;

namespace FightGame.VFX
{
    public class HitVFXManager : MonoBehaviour
    {
        public static HitVFXManager Instance;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        public void SpawnHitSpark(Vector3 position, bool isHeavy, Color themeColor)
        {
            GameObject sparkObj = new GameObject("HitSpark");
            sparkObj.transform.position = position;

            ParticleSystem ps = sparkObj.AddComponent<ParticleSystem>();
            var main = ps.main;
            main.duration = 0.25f;
            main.startLifetime = isHeavy ? 0.35f : 0.2f;
            main.startSpeed = isHeavy ? 18f : 10f;
            main.startSize = isHeavy ? 0.25f : 0.15f;
            main.startColor = isHeavy ? Color.white : themeColor;
            main.loop = false;
            main.playOnAwake = true;

            var emission = ps.emission;
            emission.rateOverTime = 0;
            emission.SetBursts(new ParticleSystem.Burst[] { new ParticleSystem.Burst(0f, isHeavy ? 35 : 18) });

            var shape = ps.shape;
            shape.shapeType = ParticleSystemShapeType.Sphere;
            shape.radius = 0.1f;

            // Luz pontual instantânea do impacto (Flash)
            GameObject lightObj = new GameObject("ImpactFlash");
            lightObj.transform.SetParent(sparkObj.transform);
            lightObj.transform.localPosition = Vector3.zero;
            Light pLight = lightObj.AddComponent<Light>();
            pLight.type = LightType.Point;
            pLight.color = themeColor;
            pLight.range = isHeavy ? 6f : 3.5f;
            pLight.intensity = isHeavy ? 4f : 2f;

            Destroy(sparkObj, 0.4f);
        }

        public void SpawnSlashTrail(Vector3 position, int direction, Color color, bool isHeavy)
        {
            GameObject slashObj = new GameObject("SlashArc");
            slashObj.transform.position = position;
            slashObj.transform.rotation = Quaternion.Euler(0, direction == 1 ? 0 : 180, isHeavy ? -25 : 15);

            LineRenderer line = slashObj.AddComponent<LineRenderer>();
            line.positionCount = 12;
            line.startWidth = isHeavy ? 0.35f : 0.18f;
            line.endWidth = 0.02f;
            line.material = new Material(Shader.Find("Sprites/Default"));
            line.startColor = Color.white;
            line.endColor = new Color(color.r, color.g, color.b, 0f);

            float radius = isHeavy ? 1.4f : 1.0f;
            for (int i = 0; i < 12; i++)
            {
                float angle = Mathf.Lerp(-Mathf.PI * 0.4f, Mathf.PI * 0.4f, i / 11f);
                Vector3 pos = new Vector3(Mathf.Cos(angle) * radius, Mathf.Sin(angle) * radius, 0);
                line.SetPosition(i, position + pos);
            }

            Destroy(slashObj, 0.12f);
        }
    }
}
