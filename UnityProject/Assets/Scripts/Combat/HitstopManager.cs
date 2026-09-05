using System.Collections;
using UnityEngine;
using FightGame.CameraSystem;
using FightGame.VFX;

namespace FightGame.Combat
{
    public class HitstopManager : MonoBehaviour
    {
        public static HitstopManager Instance;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        public void TriggerHitstop(float duration, bool isHeavy)
        {
            StartCoroutine(HitstopCoroutine(duration, isHeavy));
        }

        private IEnumerator HitstopCoroutine(float duration, bool isHeavy)
        {
            float originalTimeScale = Time.timeScale;
            Time.timeScale = 0.05f;

            if (Camera.main != null)
            {
                var cam = Camera.main.GetComponent<CombatCamera>();
                if (cam != null)
                {
                    cam.AddShake(isHeavy ? 0.35f : 0.15f, isHeavy ? 0.2f : 0.1f);
                }
            }

            yield return new WaitForSecondsRealtime(duration);
            Time.timeScale = originalTimeScale;
        }
    }
}
