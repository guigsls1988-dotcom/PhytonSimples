from app.tor_sources import TorSourceService


def test_parse_ips_accepts_public_ipv4_and_ipv6():
    text = """
    # comment
    8.8.8.8
    2001:4860:4860::8888
    10.0.0.1
    invalid
    8.8.8.8
    """
    assert TorSourceService.parse_ips(text) == {
        "8.8.8.8",
        "2001:4860:4860::8888",
    }
