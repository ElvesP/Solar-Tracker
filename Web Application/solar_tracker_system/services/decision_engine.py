from decimal import Decimal


class DecisionEngine:

    LIGHT_THRESHOLD_MIN = 1000
    LIGHT_THRESHOLD_MAX = 5000
    AZ_DIFFERENCE_THRESHOLD = 5
    EL_DIFFERENCE_THRESHOLD = 2


    @staticmethod
    def check_low_light(light_intensity):
        return DecisionEngine.LIGHT_THRESHOLD_MIN < light_intensity < DecisionEngine.LIGHT_THRESHOLD_MAX


    @staticmethod
    def check_az_movement(
        theoretical_azimuth,
        real_azimuth
    ):

        difference = abs(
            Decimal(str(theoretical_azimuth)) - Decimal(str(real_azimuth))
        )

        return difference > DecisionEngine.AZ_DIFFERENCE_THRESHOLD
    

    @staticmethod
    def check_el_movement(
        theoretical_elevation,
        real_elevation
    ):

        difference = abs(
            Decimal(str(theoretical_elevation)) - Decimal(str(real_elevation))
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