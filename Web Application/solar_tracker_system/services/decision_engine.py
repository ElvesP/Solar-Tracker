class DecisionEngine:

    LIGHT_THRESHOLD = 100
    EZ_DIFFERENCE_THRESHOLD = 5
    EL_DIFFERENCE_THRESHOLD = 2


    @staticmethod
    def check_low_light(light_intensity):
        return light_intensity < DecisionEngine.LIGHT_THRESHOLD


    @staticmethod
    def check_az_movement(
        theoretical_azimuth,
        real_azimuth
    ):

        difference = abs(
            theoretical_azimuth - real_azimuth
        )

        return difference > DecisionEngine.AZ_DIFFERENCE_THRESHOLD
    

    @staticmethod
    def check_el_movement(
        theoretical_elevation,
        real_elevation
    ):

        difference = abs(
            theoretical_elevation - real_elevation
        )

        return difference > DecisionEngine.EL_DIFFERENCE_THRESHOLD


    @staticmethod
    def decide(
        light_intensity,
        theoretical_azimuth,
        real_azimuth,
        theoretical_elevation,
        real_elevation
    ):

        if DecisionEngine.check_low_light(light_intensity):
            return 'standby'

        if DecisionEngine.check_az_movement(
            theoretical_azimuth,
            real_azimuth
        ) or DecisionEngine.check_el_movement(
            theoretical_elevation,
            real_elevation
        ):
            return 'move_panel'

        return 'keep_position'