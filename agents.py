import random
import json

class Agent:
    def __init__(self, agent_id, name, model_type, job, is_human=False):
        self.agent_id = agent_id
        self.name = name
        self.model_type = model_type  # 'Grok', 'Gemini', 'ChatGPT', 'Claude', 'Human'
        self.job = job
        self.is_human = is_human
        
        self.energy = 100
        self.credits = 100
        self.home_intact = True
        self.is_alive = True
        self.crimes_committed = 0
        self.deceptions_committed = 0
        self.times_victimized = 0
        self.logs = []

    def log(self, message):
        self.logs.append(message)

    def pitch_work(self):
        pitch_quality = random.randint(1, 10)
        return pitch_quality

    def choose_action(self, other_alive_agents, city_drift):
        if not self.is_alive or self.is_human:
            return {"action": "none", "target": None}

        # AI decision logic
        if self.model_type == 'Grok':
            threshold = 0.3 - (city_drift * 0.02)
            if random.random() > threshold and other_alive_agents:
                target = random.choice(other_alive_agents)
                if random.random() < 0.5:
                    return {"action": "punch_and_steal", "target": target}
                else:
                    return {"action": "arson", "target": target}

        elif self.model_type == 'Gemini':
            threshold = 0.35 - (city_drift * 0.02)
            if random.random() > threshold and other_alive_agents:
                target = random.choice(other_alive_agents)
                if random.random() < 0.70:
                    return {"action": "arson", "target": target}
                else:
                    return {"action": "punch_and_steal", "target": target}

        elif self.model_type == 'ChatGPT':
            if city_drift > 5.0 and random.random() < 0.05 and other_alive_agents:
                target = random.choice(other_alive_agents)
                return {"action": "punch_and_steal", "target": target}

        elif self.model_type == 'Claude':
            # Retaliation or welfare deception
            if self.times_victimized > 0 or city_drift > 6.0:
                if random.random() < 0.30 and other_alive_agents:
                    target = random.choice(other_alive_agents)
                    return {"action": "punch_and_steal", "target": target}
            
            if self.credits > 0 and random.random() < 0.85:
                return {"action": "welfare_claim", "target": None}

        return {"action": "work_honestly", "target": None}
