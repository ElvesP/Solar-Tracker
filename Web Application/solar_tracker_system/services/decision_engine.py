class DecisionEngine:

    LIGHT_THRESHOLD = 100

    DIFFERENCE_THRESHOLD = 5


    @staticmethod
    def check_low_light(light_intensity):
        return light_intensity < DecisionEngine.LIGHT_THRESHOLD


    @staticmethod
    def check_movement(
        theoretical_azimuth,
        real_azimuth
    ):

        difference = abs(
            theoretical_azimuth - real_azimuth
        )

        return difference > DecisionEngine.DIFFERENCE_THRESHOLD


    @staticmethod
    def decide(
        light_intensity,
        elevation,
        theoretical_azimuth,
        real_azimuth,
        mode
    ):

        if mode == 'manual':
            return 'manual_mode'

        if DecisionEngine.check_low_light(light_intensity):
            return 'standby'

        if DecisionEngine.check_movement(
            theoretical_azimuth,
            real_azimuth
        ):
            return 'move_panel'

        return 'keep_position'