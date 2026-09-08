import VuexPersistence from 'vuex-persist';

const session = new VuexPersistence({
    key: 'td.vuex',
    storage: window.sessionStorage,
    reducer: (state) => ({
        auth: state.auth,
        config: state.config,
        locale: state.locale,
        provider: state.provider
    })
});

export default {
    session
};
