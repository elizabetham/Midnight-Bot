let oldestLoaded = -1;

$("#searchBox").on("keyup", function (e) {
    // Set Search String
    var search_string = $(this).val();

    // Do Search
    if (search_string !== '') {
        loadData(search_string, false, -1);
    }
});

$("#loadMoreButton").click(function () {
    if (oldestLoaded == -1) return;
    loadData($("#searchBox").val(), true, oldestLoaded);
    $(this).fadeOut(200);
});

let readableTime = function (seconds) {
    let numyears = Math.floor(seconds / 31536000);
    let numdays = Math.floor((seconds % 31536000) / 86400);
    let numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
    let numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
    let numseconds = (((seconds % 31536000) % 86400) % 3600) % 60;
    let ret = "";
    if (numyears > 0) ret += numyears + "y ";
    if (numdays > 0) ret += numdays + "d ";
    if (numhours > 0) ret += numhours + "h ";
    if (numminutes > 0) ret += numminutes + "m ";
    if (numseconds > 0) ret += numseconds + "s ";
    return ret.trim();
};

let loadData = function (user, append, before) {
    let data = {user: user, amount: 5};
    if (before) data.before = before;
    $.ajax({
        type: "GET",
        url: "/api/infractions",
        data: data,
        cache: false
    }).always(function (resp) {
        if (!append) $("#resultContainer").empty();
        try {
            if (resp.hasOwnProperty("responseText")) resp = JSON.parse(resp.responseText);

            if (resp.hasOwnProperty("error")) {
                $("#resultContainer").append("<h2>" + resp.error + "</h2>");
                return;
            }

            if (!resp.hasOwnProperty("data")) {
                $("#resultContainer").append("<h2>An unknown error occurred.</h2>");
                return;
            }

            console.log(resp.data);

            resp.data.forEach(function (infraction) {
                var card = $("#infractionTemplateContainer").find("*:eq(0)").clone();
                var title = infraction.action.type + " ";
                if (infraction.action.type == "MUTE")
                    title += "(" + ((infraction.action.meta == Number.MAX_SAFE_INTEGER) ? "Permanent" : readableTime(infraction.action.meta)) + ") ";
                title += " - " + infraction.username + " (" + infraction.userid + ")";
                card.find(".card-title").text(title);
                let textContainer = card.find(".card-text");
                textContainer.append($("<p><b>Timestamp: </b>" + moment.unix(infraction.timestamp).format('MMMM Do YYYY, h:mm:ss a') + "</p>"));
                textContainer.append($("<p><b>Increased notoriety: </b>" + ((infraction.action.increasedNotoriety) ? "Yes" : "No") + "</p>"));
                if (infraction.hasOwnProperty("filter")) {
                    textContainer.append($(
                        "<p><b>Filter: </b>" + infraction.filter.displayName + "</p>" +
                        "<p><b>Offending Message:</b></p>"
                    ));
                    textContainer.append($("<pre>" + infraction.filter.triggerMessage + "</pre>"));
                }
                $("#resultContainer").append(card);
            });

            if (resp.data.length > 0)
                oldestLoaded = resp.data[resp.data.length - 1].timestamp;
            if (resp.data.length == 5)
                $("#loadMoreButton").fadeIn(200);
        } catch (e) {
            console.log(e);
            alert("Could not retrieve data. Please check the console for errors.");
        }
    }).fail(function () {
    });
};