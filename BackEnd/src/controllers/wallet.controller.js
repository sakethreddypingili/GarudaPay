const topUp = async (req, res) => {
    res.status(501).json({
        success: false,
        message: "This is just a place holder for server not to crash."
    })
}

module.exports = { topUp };