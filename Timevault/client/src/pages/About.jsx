import { motion } from 'framer-motion';

const About = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl font-heading font-bold text-gold mb-6">
            About TimeVault
          </h1>
          <div className="w-24 h-1 bg-gold mx-auto mb-8"></div>
          <p className="text-xl text-offWhite font-body leading-relaxed">
            Where luxury meets authenticity in the world of fine timepieces
          </p>
        </motion.div>

        {/* Brand Story Section */}
        <motion.div 
          className="bg-gray-900 rounded-2xl shadow-xl p-12 mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="space-y-6 text-offWhite font-body leading-relaxed">
            <p className="text-lg">
              TimeVault connects collectors, sellers, and enthusiasts through trust and verified authenticity. 
              We have revolutionized the luxury watch marketplace by implementing rigorous verification processes 
              and connecting discerning collectors with certified timepieces.
            </p>
            <p className="text-lg">
              Our Serial Validation system stands as our security innovation, ensuring every timepiece meets 
              the highest standards of authenticity and provenance. Trust is the foundation of our marketplace.
            </p>
          </div>
        </motion.div>

        {/* Side-by-side Features Section */}
        <motion.div 
          className="grid lg:grid-cols-2 gap-12 items-center mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {/* Left - Watch Image */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="aspect-square bg-gradient-to-br from-gold/20 to-gray-800 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 bg-gold/30 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <div className="w-16 h-16 bg-gold rounded-full"></div>
                </div>
                <p className="text-gold font-heading text-lg">Luxury Timepiece</p>
              </div>
            </div>
          </motion.div>

          {/* Right - Features */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-heading font-bold text-gold mb-8">
              Why Choose TimeVault
            </h2>
            <div className="space-y-6">
              <motion.div 
                className="flex items-start space-x-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="w-2 h-2 bg-gold rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h3 className="text-xl font-heading font-semibold text-gold mb-2">
                    Secure Firebase Authentication
                  </h3>
                  <p className="text-offWhite">
                    Advanced user authentication and secure account management for peace of mind.
                  </p>
                </div>
              </motion.div>

              <motion.div 
                className="flex items-start space-x-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="w-2 h-2 bg-gold rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h3 className="text-xl font-heading font-semibold text-gold mb-2">
                    Serial Number Verification
                  </h3>
                  <p className="text-offWhite">
                    Our proprietary system validates each watch's authenticity through serial verification.
                  </p>
                </div>
              </motion.div>

              <motion.div 
                className="flex items-start space-x-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="w-2 h-2 bg-gold rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h3 className="text-xl font-heading font-semibold text-gold mb-2">
                    Admin Oversight
                  </h3>
                  <p className="text-offWhite">
                    Professional oversight ensures quality control and marketplace integrity.
                  </p>
                </div>
              </motion.div>

              <motion.div 
                className="flex items-start space-x-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <div className="w-2 h-2 bg-gold rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h3 className="text-xl font-heading font-semibold text-gold mb-2">
                    User Marketplace Coming Soon
                  </h3>
                  <p className="text-offWhite">
                    Enhanced trading features and expanded marketplace functionality in development.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          className="text-center py-8 border-t border-gold/20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <p className="text-gold font-body">
            © TimeVault 2025
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
