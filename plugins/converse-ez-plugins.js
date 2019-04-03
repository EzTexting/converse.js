function modifyRoom(rooms) {
    rooms.forEach((room) => {
        const room_name = room.attributes.name;
        const chat_number = room_name.split('_')[1];
        const customer_number = room_name.split('_')[0];
        room.features.set({
            from_number: chat_number,
            customer_number: customer_number
        });
        console.log(room);
    })
}


converse.plugins.add('EZ_Sidebar', {
    initialize: function () {
        const _converse = this._converse;
        _converse.api.listen.on('connected', () => {
            const available_rooms = _converse.api.rooms.get();
            modifyRoom(available_rooms);
        });
    }
});
converse.plugins.add('EZ_RoomJoin', {
    initialize: function () {
        const _converse = this._converse;
        _converse.api.listen.on('connected', () => {
            console.log('here');
            const $iq = converse.env.$iq;
            const jid = _converse.api.user.jid();
            const Strophe = converse.env.Strophe;
            const iq = $iq({
                'from': jid,
                'to': 'sms.xmpp.callfire.com',
                'type': "get"
            }).c("query", {xmlns: Strophe.NS.DISCO_ITEMS});
            if (_converse.api.rooms.get().length === 0) {
                _converse.api.sendIQ(iq)
                    .then(iq => {
                        const rooms = iq.querySelectorAll('query item');
                        for (let i = 0; i < rooms.length; ++i) {
                            const room = rooms[i].attributes.jid.value;
                            _converse.api.rooms.create(room);
                        }
                        const available_rooms = _converse.api.rooms.get();
                        modifyRoom(available_rooms);
                    }).catch(iq => console.log(iq));
            }
        });
    }
});
